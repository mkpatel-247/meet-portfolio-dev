import { Component, OnInit } from '@angular/core';
import { ChatComponent } from '../chat.component';
import { ChatService } from '../chat.service';
import { ChatConfig, Message } from '../chat.types';

/**
 * Example component demonstrating chat integration
 */
@Component({
  selector: 'app-chat-example',
  standalone: true,
  imports: [ChatComponent],
  template: `
    <div class="example-container">
      <h1>Chat Component Example</h1>
      
      <div class="example-controls">
        <button (click)="toggleChat()" class="example-button">
          {{ chatOpen ? 'Close' : 'Open' }} Chat
        </button>
        <button (click)="switchMode()" class="example-button">
          Switch to {{ currentMode === 'http' ? 'WebSocket' : 'HTTP' }}
        </button>
        <button (click)="clearHistory()" class="example-button">
          Clear History
        </button>
      </div>

      <div class="example-info">
        <p><strong>Mode:</strong> {{ currentMode }}</p>
        <p><strong>Status:</strong> {{ connectionStatus }}</p>
        <p><strong>Messages:</strong> {{ messageCount }}</p>
      </div>

      <app-chat
        [config]="chatConfig"
        [(isOpen)]="chatOpen"
        (messageReceived)="onMessageReceived($event)"
        (error)="onError($event)"
      ></app-chat>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .example-controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .example-button {
      padding: 0.75rem 1.5rem;
      border: 2px solid var(--accent-color);
      background: transparent;
      color: var(--accent-color);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .example-button:hover {
      background: var(--accent-color);
      color: white;
    }

    .example-info {
      background: var(--card-dark);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 1px solid var(--border-dark);
    }

    .example-info p {
      margin: 0.5rem 0;
      color: var(--text-dark);
    }

    body.light .example-info {
      background: var(--card-light);
      border-color: var(--border-light);
    }

    body.light .example-info p {
      color: var(--text-light);
    }
  `],
})
export class ChatExampleComponent implements OnInit {
  chatOpen = false;
  currentMode: 'http' | 'websocket' = 'http';
  connectionStatus = 'disconnected';
  messageCount = 0;

  chatConfig: ChatConfig = {
    mode: 'http',
    endpoint: '/api/chat',
    enableLocalStorage: true,
    maxStoredMessages: 50,
    maxRetries: 3,
  };

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to connection status
    this.chatService.connectionStatus$.subscribe((status) => {
      this.connectionStatus = status;
    });

    // Subscribe to messages to count them
    this.chatService.messages$.subscribe((messages) => {
      this.messageCount = messages.length;
    });

    // Set initial config
    this.chatService.setConfig(this.chatConfig);
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
  }

  switchMode(): void {
    this.currentMode = this.currentMode === 'http' ? 'websocket' : 'http';
    this.chatConfig = {
      ...this.chatConfig,
      mode: this.currentMode,
      endpoint:
        this.currentMode === 'http'
          ? '/api/chat'
          : 'ws://localhost:8080/chat',
    };
    this.chatService.setMode(this.currentMode);

    if (this.currentMode === 'websocket') {
      this.chatService.connect();
    } else {
      this.chatService.disconnect();
    }
  }

  clearHistory(): void {
    if (confirm('Are you sure you want to clear all messages?')) {
      this.chatService.clearMessages();
    }
  }

  onMessageReceived(message: Message): void {
    console.log('Message received:', message);
    // You can add custom logic here, e.g., analytics, notifications, etc.
  }

  onError(error: any): void {
    console.error('Chat error:', error);
    // You can add error handling here, e.g., show toast notification
  }
}

