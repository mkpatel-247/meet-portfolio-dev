import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { Message, ChatConfig } from './chat.types';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    service.cleanup();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration', () => {
    it('should set and get configuration', () => {
      const config: Partial<ChatConfig> = {
        endpoint: '/api/test',
        maxRetries: 5,
      };
      service.setConfig(config);
      const retrieved = service.getConfig();
      expect(retrieved.endpoint).toBe('/api/test');
      expect(retrieved.maxRetries).toBe(5);
    });

    it('should set transport mode', () => {
      service.setMode('websocket');
      expect(service.getConfig().mode).toBe('websocket');
    });
  });

  describe('HTTP Message Sending', () => {
    beforeEach(() => {
      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
    });

    it('should send message via HTTP', (done) => {
      const userMessage = 'Hello, test!';
      const mockResponse = {
        message: {
          id: 'msg_123',
          role: 'assistant' as const,
          content: 'Hello! How can I help?',
          createdAt: new Date().toISOString(),
        },
      };

      service.sendMessage(userMessage).subscribe((response) => {
        expect(response.role).toBe('assistant');
        expect(response.content).toBe('Hello! How can I help?');
        const messages = service.getMessages();
        expect(messages.length).toBe(2); // User + Assistant
        expect(messages[0].content).toBe(userMessage);
        done();
      });

      const req = httpMock.expectOne('/api/chat');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.messages.length).toBe(1);
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', (done) => {
      const userMessage = 'Test message';
      service.sendMessage(userMessage).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeTruthy();
          const messages = service.getMessages();
          const userMsg = messages.find((m) => m.role === 'user');
          expect(userMsg?.status).toBe('error');
          done();
        },
      });

      const req = httpMock.expectOne('/api/chat');
      req.error(new ProgressEvent('Network error'), { status: 500 });
    });

    it('should retry on failure', (done) => {
      service.setConfig({ mode: 'http', endpoint: '/api/chat', maxRetries: 2 });
      const userMessage = 'Test message';

      service.sendMessage(userMessage).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          done();
        },
        error: () => {
          // After retries, should error
          done();
        },
      });

      // First request fails
      const req1 = httpMock.expectOne('/api/chat');
      req1.error(new ProgressEvent('Network error'), { status: 500 });

      // Retry succeeds
      const req2 = httpMock.expectOne('/api/chat');
      req2.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });
    });
  });

  describe('Message Management', () => {
    it('should add messages to history', () => {
      const messages = service.getMessages();
      expect(messages.length).toBe(0);

      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
      service.sendMessage('Test').subscribe();

      const req = httpMock.expectOne('/api/chat');
      req.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });

      const updatedMessages = service.getMessages();
      expect(updatedMessages.length).toBe(2);
    });

    it('should clear messages', () => {
      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
      service.sendMessage('Test').subscribe();

      const req = httpMock.expectOne('/api/chat');
      req.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });

      expect(service.getMessages().length).toBe(2);
      service.clearMessages();
      expect(service.getMessages().length).toBe(0);
    });

    it('should retry failed message', (done) => {
      service.setConfig({ mode: 'http', endpoint: '/api/chat' });

      // First attempt fails
      service.sendMessage('Test').subscribe({
        error: () => {
          const messages = service.getMessages();
          const failedMessage = messages.find((m) => m.role === 'user');
          expect(failedMessage).toBeTruthy();

          // Retry
          if (failedMessage) {
            service.retryMessage(failedMessage.id).subscribe((response) => {
              expect(response).toBeTruthy();
              done();
            });

            const retryReq = httpMock.expectOne('/api/chat');
            retryReq.flush({
              message: {
                id: 'msg_456',
                role: 'assistant',
                content: 'Retry response',
                createdAt: new Date().toISOString(),
              },
            });
          }
        },
      });

      const req = httpMock.expectOne('/api/chat');
      req.error(new ProgressEvent('Network error'), { status: 500 });
    });
  });

  describe('Observables', () => {
    it('should emit messages via messages$', (done) => {
      service.messages$.subscribe((messages) => {
        if (messages.length > 0) {
          expect(messages[0].content).toBe('Test');
          done();
        }
      });

      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
      service.sendMessage('Test').subscribe();

      const req = httpMock.expectOne('/api/chat');
      req.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });
    });

    it('should emit processing state', (done) => {
      let processingCount = 0;
      service.isProcessing$.subscribe((isProcessing) => {
        processingCount++;
        if (processingCount === 1) {
          expect(isProcessing).toBe(true);
        } else if (processingCount === 2) {
          expect(isProcessing).toBe(false);
          done();
        }
      });

      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
      service.sendMessage('Test').subscribe();

      const req = httpMock.expectOne('/api/chat');
      req.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });
    });
  });

  describe('Cancel', () => {
    it('should cancel current request', () => {
      service.setConfig({ mode: 'http', endpoint: '/api/chat' });
      service.sendMessage('Test').subscribe();

      service.cancelCurrent();

      const req = httpMock.expectOne('/api/chat');
      expect(req.cancelled).toBe(true);
    });
  });

  describe('LocalStorage', () => {
    it('should save messages to localStorage when enabled', () => {
      service.setConfig({
        mode: 'http',
        endpoint: '/api/chat',
        enableLocalStorage: true,
      });

      service.sendMessage('Test').subscribe();

      const req = httpMock.expectOne('/api/chat');
      req.flush({
        message: {
          id: 'msg_123',
          role: 'assistant',
          content: 'Response',
          createdAt: new Date().toISOString(),
        },
      });

      const stored = localStorage.getItem('chat_messages');
      expect(stored).toBeTruthy();
      const messages = JSON.parse(stored!);
      expect(messages.length).toBe(2);
    });

    it('should load messages from localStorage on init', () => {
      const storedMessages: Message[] = [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Stored message',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('chat_messages', JSON.stringify(storedMessages));

      const newService = TestBed.inject(ChatService);
      newService.setConfig({ enableLocalStorage: true });
      const messages = newService.getMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Stored message');
    });
  });
});

