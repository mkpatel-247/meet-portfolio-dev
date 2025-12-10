import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { Message, ChatConfig, ConnectionStatus } from './chat.types';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() config?: Partial<ChatConfig>;
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() messageReceived = new EventEmitter<Message>();
  @Output() error = new EventEmitter<any>();

  @ViewChild('messagesContainer', { static: false })
  messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput', { static: false })
  messageInput?: ElementRef<HTMLTextAreaElement>;

  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  messages: Message[] = [];
  currentMessage = '';
  isProcessing = false;
  connectionStatus: ConnectionStatus = 'disconnected';
  errorMessage?: string;
  shouldAutoScroll = true;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    if (this.config) {
      this.chatService.setConfig(this.config);
    }

    // Subscribe to messages
    this.subscriptions.add(
      this.chatService.messages$
        .pipe(takeUntil(this.destroy$))
        .subscribe((messages) => {
          this.messages = messages;
          this.cdr.markForCheck();
          if (this.shouldAutoScroll && isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        })
    );

    // Subscribe to processing state
    this.subscriptions.add(
      this.chatService.isProcessing$
        .pipe(takeUntil(this.destroy$))
        .subscribe((processing) => {
          this.isProcessing = processing;
          this.cdr.markForCheck();
        })
    );

    // Subscribe to connection status
    this.subscriptions.add(
      this.chatService.connectionStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe((status) => {
          this.connectionStatus = status;
          this.cdr.markForCheck();
        })
    );

    // Subscribe to errors
    this.subscriptions.add(
      this.chatService.errors$
        .pipe(takeUntil(this.destroy$))
        .subscribe((error) => {
          this.errorMessage = error;
          this.error.emit(error);
          this.cdr.markForCheck();
          // Clear error after 5 seconds
          setTimeout(() => {
            this.errorMessage = undefined;
            this.cdr.markForCheck();
          }, 5000);
        })
    );

    // Subscribe to events
    this.subscriptions.add(
      this.chatService.events$
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          if (event.type === 'messageReceived') {
            this.messageReceived.emit(event.data);
          } else if (event.type === 'error') {
            this.error.emit(event.data);
          }
        })
    );

    // Connect if WebSocket mode
    if (this.config?.mode === 'websocket') {
      this.chatService.connect();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
    // Disconnect if WebSocket mode
    if (this.config?.mode === 'websocket') {
      this.chatService.disconnect();
    }
  }

  /**
   * Send message
   */
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isProcessing) {
      return;
    }

    const messageText = this.currentMessage.trim();
    this.currentMessage = '';

    this.chatService.sendMessage(messageText).subscribe({
      next: (message) => {
        // Message handled via messages$ subscription
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.error.emit(error);
      },
    });
  }

  /**
   * Handle Enter key (Shift+Enter for newline)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Retry failed message
   */
  retryMessage(messageId: string): void {
    this.chatService.retryMessage(messageId).subscribe({
      next: (message) => {
        // Message handled via messages$ subscription
      },
      error: (error) => {
        console.error('Error retrying message:', error);
        this.error.emit(error);
      },
    });
  }

  /**
   * Cancel current request
   */
  cancelCurrent(): void {
    this.chatService.cancelCurrent();
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    if (confirm('Are you sure you want to clear all messages?')) {
      this.chatService.clearMessages();
    }
  }

  /**
   * Toggle chat open/close
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
    if (this.isOpen && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.messageInput?.nativeElement.focus();
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Close chat
   */
  closeChat(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  /**
   * Open chat
   */
  openChat(): void {
    this.isOpen = true;
    this.isOpenChange.emit(true);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.messageInput?.nativeElement.focus();
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    if (this.messagesContainer && isPlatformBrowser(this.platformId)) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Handle scroll event to detect if user scrolled up
   */
  onScroll(): void {
    if (!this.messagesContainer || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const element = this.messagesContainer.nativeElement;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    this.shouldAutoScroll = isAtBottom;
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get message avatar initials
   */
  getAvatarInitials(role: string): string {
    return role === 'user' ? 'U' : 'A';
  }

  /**
   * Check if message has error
   */
  hasError(message: Message): boolean {
    return message.status === 'error' && !!message.error;
  }

  /**
   * Check if message is processing
   */
  isProcessingMessage(message: Message): boolean {
    return message.status === 'processing' || message.status === 'partial';
  }

  /**
   * Track by function for ngFor
   */
  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
