import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError, timer } from 'rxjs';
import {
  catchError,
  map,
  retryWhen,
  take,
  scan,
  switchMap,
  finalize,
  takeUntil,
} from 'rxjs/operators';
import {
  Message,
  ChatConfig,
  ConnectionStatus,
  TransportMode,
  ChatRequest,
  ChatResponse,
  ChatStreamDelta,
  WebSocketMessage,
} from './chat.types';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private config: ChatConfig = {
    mode: 'http',
    endpoint: '/api/chat',
    maxRetries: 3,
    retryDelay: 1000,
    enableLocalStorage: true,
    maxStoredMessages: 50,
    rateLimitDelay: 500,
    autoReconnect: true,
    reconnectDelay: 2000,
    reconnectMaxAttempts: 5,
  };

  // State observables
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public readonly messages$ = this.messagesSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>(
    'disconnected'
  );
  public readonly connectionStatus$ =
    this.connectionStatusSubject.asObservable();

  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public readonly isProcessing$ = this.isProcessingSubject.asObservable();

  private errorsSubject = new Subject<string>();
  public readonly errors$ = this.errorsSubject.asObservable();

  // Events for component communication
  private eventsSubject = new Subject<any>();
  public readonly events$ = this.eventsSubject.asObservable();

  // Internal state
  private currentRequestId?: string;
  private cancelSubject = new Subject<void>();
  private websocket?: WebSocket;
  private reconnectAttempts = 0;
  private reconnectTimer?: any;
  private lastSendTime = 0;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadMessagesFromStorage();
  }

  /**
   * Configure the chat service
   */
  setConfig(config: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.sessionId) {
      this.sessionId = config.sessionId;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatConfig {
    return { ...this.config };
  }

  /**
   * Set transport mode
   */
  setMode(mode: TransportMode): void {
    if (this.config.mode !== mode) {
      this.disconnect();
      this.config.mode = mode;
      if (mode === 'websocket' && this.config.autoReconnect) {
        this.connect();
      }
    }
  }

  /**
   * Get current messages
   */
  getMessages(): Message[] {
    return [...this.messagesSubject.value];
  }

  /**
   * Send a message
   */
  sendMessage(text: string): Observable<Message> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;
    if (timeSinceLastSend < this.config.rateLimitDelay!) {
      const delay = this.config.rateLimitDelay! - timeSinceLastSend;
      return timer(delay).pipe(switchMap(() => this.sendMessage(text)));
    }
    this.lastSendTime = now;

    // Create user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // Add user message optimistically
    this.addMessage(userMessage);

    // Send based on mode
    if (this.config.mode === 'websocket') {
      return this.sendMessageWebSocket(userMessage);
    } else {
      return this.sendMessageHttp(userMessage);
    }
  }

  /**
   * Send message via HTTP
   */
  private sendMessageHttp(userMessage: Message): Observable<Message> {
    this.isProcessingSubject.next(true);
    this.currentRequestId = userMessage.id;

    const request: ChatRequest = {
      sessionId: this.sessionId,
      messages: this.getMessages(),
      stream: false,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.config.headers,
    });

    // Create new cancel subject for this request
    const cancel$ = new Subject<void>();
    this.cancelSubject = cancel$;

    return this.http
      .post<ChatResponse>(this.config.endpoint!, request, {
        headers,
      })
      .pipe(
        takeUntil(cancel$),
        retryWhen((errors) =>
          errors.pipe(
            scan((retryCount, error) => {
              if (retryCount >= this.config.maxRetries!) {
                throw error;
              }
              return retryCount + 1;
            }, 0),
            switchMap((retryCount) =>
              timer(this.config.retryDelay! * Math.pow(2, retryCount))
            ),
            take(this.config.maxRetries!)
          )
        ),
        map((response) => {
          const assistantMessage: Message = {
            ...response.message,
            id: response.message.id || this.generateMessageId(),
            status: 'delivered',
            createdAt: response.message.createdAt || new Date().toISOString(),
          };
          this.addMessage(assistantMessage);
          this.isProcessingSubject.next(false);
          this.currentRequestId = undefined;
          this.eventsSubject.next({
            type: 'messageReceived',
            data: assistantMessage,
          });
          return assistantMessage;
        }),
        catchError((error: any) => {
          this.handleError(error, userMessage);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isProcessingSubject.next(false);
          this.currentRequestId = undefined;
        })
      );
  }

  /**
   * Send message via HTTP with streaming (SSE)
   */
  sendMessageStream(text: string): Observable<string> {
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    this.addMessage(userMessage);
    this.isProcessingSubject.next(true);
    this.currentRequestId = userMessage.id;

    const request: ChatRequest = {
      sessionId: this.sessionId,
      messages: this.getMessages(),
      stream: true,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.config.headers,
    });

    // Create assistant message placeholder
    const assistantMessageId = this.generateMessageId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'processing',
    };
    this.addMessage(assistantMessage);

    return new Observable<string>((observer) => {
      fetch(this.config.endpoint!, {
        method: 'POST',
        headers: Object.fromEntries(
          headers.keys().map((k) => [k, headers.get(k)!])
        ),
        body: JSON.stringify(request),
      })
        .then((response) => {
          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const readChunk = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  // Update message status
                  const messages = this.getMessages();
                  const msgIndex = messages.findIndex(
                    (m) => m.id === assistantMessageId
                  );
                  if (msgIndex >= 0) {
                    messages[msgIndex].status = 'delivered';
                    this.messagesSubject.next([...messages]);
                    this.saveMessagesToStorage();
                  }
                  this.isProcessingSubject.next(false);
                  this.currentRequestId = undefined;
                  observer.complete();
                  return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                lines.forEach((line) => {
                  if (line.trim()) {
                    try {
                      if (line.startsWith('data: ')) {
                        const data = JSON.parse(
                          line.substring(6)
                        ) as ChatStreamDelta;
                        if (data.delta) {
                          const messages = this.getMessages();
                          const msgIndex = messages.findIndex(
                            (m) => m.id === assistantMessageId
                          );
                          if (msgIndex >= 0) {
                            messages[msgIndex].content += data.delta;
                            messages[msgIndex].status = 'partial';
                            this.messagesSubject.next([...messages]);
                            observer.next(data.delta);
                          }
                        }
                        if (data.complete) {
                          const messages = this.getMessages();
                          const msgIndex = messages.findIndex(
                            (m) => m.id === assistantMessageId
                          );
                          if (msgIndex >= 0) {
                            messages[msgIndex].status = 'delivered';
                            this.messagesSubject.next([...messages]);
                            this.saveMessagesToStorage();
                          }
                        }
                      }
                    } catch (e) {
                      console.warn('Failed to parse SSE chunk:', e);
                    }
                  }
                });

                readChunk();
              })
              .catch((error) => {
                observer.error(error);
                this.handleError(error, userMessage);
              });
          };

          readChunk();
        })
        .catch((error) => {
          observer.error(error);
          this.handleError(error, userMessage);
        });
    });
  }

  /**
   * Send message via WebSocket
   */
  private sendMessageWebSocket(userMessage: Message): Observable<Message> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return throwError(() => new Error('WebSocket not connected'));
    }

    this.isProcessingSubject.next(true);
    this.currentRequestId = userMessage.id;

    const assistantMessageId = this.generateMessageId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'processing',
    };
    this.addMessage(assistantMessage);

    const wsMessage: WebSocketMessage = {
      type: 'send',
      messages: this.getMessages(),
    };

    this.websocket.send(JSON.stringify(wsMessage));

    return new Observable<Message>((observer) => {
      const messageHandler = (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.type === 'delta' && data.delta) {
            const messages = this.getMessages();
            const msgIndex = messages.findIndex(
              (m) => m.id === assistantMessageId
            );
            if (msgIndex >= 0) {
              messages[msgIndex].content += data.delta;
              messages[msgIndex].status = 'partial';
              this.messagesSubject.next([...messages]);
            }
          } else if (data.type === 'done' && data.message) {
            const messages = this.getMessages();
            const msgIndex = messages.findIndex(
              (m) => m.id === assistantMessageId
            );
            if (msgIndex >= 0) {
              messages[msgIndex] = {
                ...data.message,
                id: assistantMessageId,
                status: 'delivered',
              };
              this.messagesSubject.next([...messages]);
              this.saveMessagesToStorage();
            }
            this.isProcessingSubject.next(false);
            this.currentRequestId = undefined;
            this.eventsSubject.next({
              type: 'messageReceived',
              data: data.message,
            });
            observer.next(data.message);
            observer.complete();
            this.websocket?.removeEventListener('message', messageHandler);
          } else if (data.type === 'error') {
            this.handleError(
              new Error(data.error || 'WebSocket error'),
              userMessage
            );
            observer.error(new Error(data.error || 'WebSocket error'));
            this.websocket?.removeEventListener('message', messageHandler);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket?.addEventListener('message', messageHandler);

      // Timeout after 60 seconds
      const timeout = setTimeout(() => {
        this.websocket?.removeEventListener('message', messageHandler);
        const error = new Error('Request timeout');
        this.handleError(error, userMessage);
        observer.error(error);
      }, 60000);

      return () => {
        clearTimeout(timeout);
        this.websocket?.removeEventListener('message', messageHandler);
      };
    });
  }

  /**
   * Connect WebSocket
   */
  connect(): void {
    if (this.config.mode !== 'websocket') {
      return;
    }

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatusSubject.next('connecting');

    try {
      const url = new URL(this.config.endpoint!);
      if (this.sessionId) {
        url.searchParams.set('sessionId', this.sessionId);
      }
      this.websocket = new WebSocket(url.toString());

      this.websocket.onopen = () => {
        this.connectionStatusSubject.next('connected');
        this.reconnectAttempts = 0;
        this.eventsSubject.next({
          type: 'connectionStatusChanged',
          data: 'connected',
        });
      };

      this.websocket.onclose = () => {
        this.connectionStatusSubject.next('disconnected');
        this.eventsSubject.next({
          type: 'connectionStatusChanged',
          data: 'disconnected',
        });
        if (
          this.config.autoReconnect &&
          this.reconnectAttempts < this.config.reconnectMaxAttempts!
        ) {
          this.scheduleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        this.connectionStatusSubject.next('error');
        this.errorsSubject.next('WebSocket connection error');
        this.eventsSubject.next({ type: 'error', data: error });
      };

      this.websocket.onmessage = (event) => {
        // Handled in sendMessageWebSocket
      };
    } catch (error) {
      this.connectionStatusSubject.next('error');
      this.errorsSubject.next('Failed to create WebSocket connection');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    this.connectionStatusSubject.next('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Cancel current request
   */
  cancelCurrent(): void {
    if (this.cancelSubject) {
      this.cancelSubject.next();
      this.cancelSubject.complete();
      this.cancelSubject = new Subject<void>();
    }
    if (this.currentRequestId) {
      const messages = this.getMessages();
      const msgIndex = messages.findIndex(
        (m) => m.id === this.currentRequestId
      );
      if (msgIndex >= 0 && messages[msgIndex].status === 'processing') {
        messages[msgIndex].status = 'error';
        messages[msgIndex].error = 'Cancelled by user';
        this.messagesSubject.next([...messages]);
      }
      this.currentRequestId = undefined;
    }
    this.isProcessingSubject.next(false);
  }

  /**
   * Retry a failed message
   */
  retryMessage(messageId: string): Observable<Message> {
    const messages = this.getMessages();
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex < 0) {
      return throwError(() => new Error('Message not found'));
    }

    const failedMessage = messages[messageIndex];
    if (failedMessage.role !== 'user') {
      return throwError(() => new Error('Can only retry user messages'));
    }

    // Remove the failed message and its response
    const newMessages = messages.slice(0, messageIndex);
    this.messagesSubject.next(newMessages);
    this.saveMessagesToStorage();

    // Resend
    return this.sendMessage(failedMessage.content);
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
    this.saveMessagesToStorage();
  }

  /**
   * Add message to history
   */
  private addMessage(message: Message): void {
    const messages = [...this.messagesSubject.value, message];
    this.messagesSubject.next(messages);
    this.saveMessagesToStorage();
  }

  /**
   * Handle errors
   */
  private handleError(error: any, userMessage: Message): void {
    const errorMessage = error?.message || 'An error occurred';
    this.errorsSubject.next(errorMessage);

    const messages = this.getMessages();
    const msgIndex = messages.findIndex((m) => m.id === userMessage.id);
    if (msgIndex >= 0) {
      messages[msgIndex].status = 'error';
      messages[msgIndex].error = errorMessage;
      this.messagesSubject.next([...messages]);
    }

    this.eventsSubject.next({ type: 'error', data: error });
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  /**
   * Load messages from localStorage
   */
  private loadMessagesFromStorage(): void {
    if (!this.config.enableLocalStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem('chat_messages');
      if (stored) {
        const messages: Message[] = JSON.parse(stored);
        const limited = messages.slice(-this.config.maxStoredMessages!);
        this.messagesSubject.next(limited);
      }
    } catch (error) {
      console.warn('Failed to load messages from storage:', error);
    }
  }

  /**
   * Save messages to localStorage
   */
  private saveMessagesToStorage(): void {
    if (!this.config.enableLocalStorage) {
      return;
    }

    try {
      const messages = this.messagesSubject.value;
      const limited = messages.slice(-this.config.maxStoredMessages!);
      localStorage.setItem('chat_messages', JSON.stringify(limited));
    } catch (error) {
      console.warn('Failed to save messages to storage:', error);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  /**
   * Cleanup - call this when service is no longer needed
   * Note: Services with providedIn: 'root' don't automatically call ngOnDestroy
   */
  cleanup(): void {
    this.disconnect();
    this.cancelCurrent();
    this.messagesSubject.complete();
    this.connectionStatusSubject.complete();
    this.isProcessingSubject.complete();
    this.errorsSubject.complete();
    this.eventsSubject.complete();
  }
}
