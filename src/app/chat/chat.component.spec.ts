import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat.component';
import { ChatService } from './chat.service';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { Message, ConnectionStatus } from './chat.types';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: jasmine.SpyObj<ChatService>;

  const mockMessages$ = new BehaviorSubject<Message[]>([]);
  const mockIsProcessing$ = new BehaviorSubject<boolean>(false);
  const mockConnectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');
  const mockErrors$ = new Subject<string>();
  const mockEvents$ = new Subject<any>();

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'setConfig',
      'sendMessage',
      'retryMessage',
      'cancelCurrent',
      'clearMessages',
      'connect',
    ], {
      messages$: mockMessages$,
      isProcessing$: mockIsProcessing$,
      connectionStatus$: mockConnectionStatus$,
      errors$: mockErrors$,
      events$: mockEvents$,
    });

    await TestBed.configureTestingModule({
      imports: [ChatComponent, FormsModule],
      providers: [{ provide: ChatService, useValue: chatServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    fixture.detectChanges();
    expect(component.messages).toEqual([]);
    expect(component.isProcessing).toBe(false);
    expect(component.connectionStatus).toBe('disconnected');
  });

  it('should set config on init', () => {
    component.config = { mode: 'websocket', endpoint: 'ws://test' };
    fixture.detectChanges();
    expect(chatService.setConfig).toHaveBeenCalledWith(component.config);
  });

  it('should subscribe to messages', () => {
    const testMessage: Message = {
      id: 'msg_1',
      role: 'user',
      content: 'Test message',
      createdAt: new Date().toISOString(),
    };

    fixture.detectChanges();
    mockMessages$.next([testMessage]);
    fixture.detectChanges();

    expect(component.messages).toContain(testMessage);
  });

  it('should send message on sendMessage call', () => {
    const testResponse: Message = {
      id: 'msg_2',
      role: 'assistant',
      content: 'Response',
      createdAt: new Date().toISOString(),
    };

    chatService.sendMessage.and.returnValue(of(testResponse));

    component.currentMessage = 'Hello';
    component.sendMessage();

    expect(chatService.sendMessage).toHaveBeenCalledWith('Hello');
    expect(component.currentMessage).toBe('');
  });

  it('should not send empty message', () => {
    component.currentMessage = '';
    component.sendMessage();
    expect(chatService.sendMessage).not.toHaveBeenCalled();

    component.currentMessage = '   ';
    component.sendMessage();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle Enter key to send', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    chatService.sendMessage.and.returnValue(of({
      id: 'msg_1',
      role: 'assistant',
      content: 'Response',
      createdAt: new Date().toISOString(),
    }));

    component.currentMessage = 'Test';
    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(chatService.sendMessage).toHaveBeenCalled();
  });

  it('should not send on Shift+Enter', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should retry failed message', () => {
    const failedMessage: Message = {
      id: 'msg_1',
      role: 'user',
      content: 'Test',
      createdAt: new Date().toISOString(),
      status: 'error',
    };

    chatService.retryMessage.and.returnValue(of({
      id: 'msg_2',
      role: 'assistant',
      content: 'Response',
      createdAt: new Date().toISOString(),
    }));

    component.retryMessage('msg_1');
    expect(chatService.retryMessage).toHaveBeenCalledWith('msg_1');
  });

  it('should cancel current request', () => {
    component.cancelCurrent();
    expect(chatService.cancelCurrent).toHaveBeenCalled();
  });

  it('should clear messages with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.clearMessages();
    expect(chatService.clearMessages).toHaveBeenCalled();
  });

  it('should not clear messages without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.clearMessages();
    expect(chatService.clearMessages).not.toHaveBeenCalled();
  });

  it('should toggle chat open/close', () => {
    expect(component.isOpen).toBe(false);
    component.toggleChat();
    expect(component.isOpen).toBe(true);
    component.toggleChat();
    expect(component.isOpen).toBe(false);
  });

  it('should format timestamp correctly', () => {
    const timestamp = '2024-01-01T12:30:00.000Z';
    const formatted = component.formatTime(timestamp);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it('should get avatar initials', () => {
    expect(component.getAvatarInitials('user')).toBe('U');
    expect(component.getAvatarInitials('assistant')).toBe('A');
  });

  it('should detect error messages', () => {
    const errorMessage: Message = {
      id: 'msg_1',
      role: 'user',
      content: 'Test',
      createdAt: new Date().toISOString(),
      status: 'error',
      error: 'Network error',
    };

    expect(component.hasError(errorMessage)).toBe(true);
  });

  it('should detect processing messages', () => {
    const processingMessage: Message = {
      id: 'msg_1',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'processing',
    };

    expect(component.isProcessingMessage(processingMessage)).toBe(true);
  });
});

