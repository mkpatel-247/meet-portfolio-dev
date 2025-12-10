# Chat Component Integration Guide

This guide explains how to integrate the Chat component into your Angular application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Integration](#basic-integration)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [HTTP Mode](#http-mode)
- [WebSocket Mode](#websocket-mode)
- [Events & Outputs](#events--outputs)
- [Styling & Theming](#styling--theming)
- [Accessibility](#accessibility)
- [Mock Server for Development](#mock-server-for-development)
- [Examples](#examples)

## Overview

The Chat component is a fully-featured chatbot UI that supports:
- **HTTP** request/response with optional Server-Sent Events (SSE) streaming
- **WebSocket** for low-latency bidirectional communication
- Message history with localStorage persistence
- Error handling with retry logic
- Optimistic UI updates
- Typing indicators and streaming responses
- Full keyboard and screen reader accessibility
- Responsive design with light/dark theme support

## Installation

The chat component is already included in your project. No additional dependencies are required beyond what's already in your `package.json`.

## Basic Integration

### 1. Import the Component

Add the `ChatComponent` to your component's imports:

```typescript
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [ChatComponent],
  // ...
})
export class MyComponent {}
```

### 2. Add to Template

```html
<app-chat
  [config]="chatConfig"
  [(isOpen)]="chatOpen"
  (messageReceived)="onMessageReceived($event)"
  (error)="onChatError($event)"
></app-chat>
```

### 3. Configure in Component

```typescript
export class MyComponent {
  chatOpen = false;
  
  chatConfig = {
    mode: 'http' as const, // or 'websocket'
    endpoint: '/api/chat',
    sessionId: 'user-session-123',
    maxRetries: 3,
    enableLocalStorage: true,
    maxStoredMessages: 50,
  };

  onMessageReceived(message: Message) {
    console.log('Received message:', message);
  }

  onChatError(error: any) {
    console.error('Chat error:', error);
  }
}
```

## Configuration

### ChatConfig Interface

```typescript
interface ChatConfig {
  mode: 'http' | 'websocket';           // Transport mode
  endpoint?: string;                     // HTTP endpoint or WebSocket URL
  sessionId?: string;                    // Session identifier
  headers?: Record<string, string>;      // Custom HTTP headers
  maxRetries?: number;                   // Max retry attempts (default: 3)
  retryDelay?: number;                    // Initial retry delay in ms (default: 1000)
  enableLocalStorage?: boolean;           // Persist messages (default: true)
  maxStoredMessages?: number;            // Max messages to store (default: 50)
  rateLimitDelay?: number;               // Min delay between sends in ms (default: 500)
  autoReconnect?: boolean;                // Auto-reconnect WebSocket (default: true)
  reconnectDelay?: number;              // Reconnect delay in ms (default: 2000)
  reconnectMaxAttempts?: number;         // Max reconnect attempts (default: 5)
}
```

### Example Configurations

**HTTP Mode:**
```typescript
chatConfig = {
  mode: 'http',
  endpoint: '/api/chat',
  sessionId: 'user-123',
  maxRetries: 3,
  enableLocalStorage: true,
};
```

**WebSocket Mode:**
```typescript
chatConfig = {
  mode: 'websocket',
  endpoint: 'wss://api.example.com/chat',
  sessionId: 'user-123',
  autoReconnect: true,
  reconnectMaxAttempts: 5,
};
```

**With Custom Headers:**
```typescript
chatConfig = {
  mode: 'http',
  endpoint: '/api/chat',
  headers: {
    'Authorization': 'Bearer token-here',
    'X-Custom-Header': 'value',
  },
};
```

## API Reference

### ChatService

The `ChatService` provides the core functionality for sending messages and managing state.

#### Methods

**`setConfig(config: Partial<ChatConfig>): void`**
- Update service configuration

**`setMode(mode: 'http' | 'websocket'): void`**
- Switch transport mode

**`sendMessage(text: string): Observable<Message>`**
- Send a message and receive the assistant's response

**`sendMessageStream(text: string): Observable<string>`**
- Send a message with streaming response (HTTP SSE)

**`retryMessage(messageId: string): Observable<Message>`**
- Retry a failed message

**`cancelCurrent(): void`**
- Cancel the current in-flight request

**`connect(): void`**
- Connect WebSocket (WebSocket mode only)

**`disconnect(): void`**
- Disconnect WebSocket

**`clearMessages(): void`**
- Clear all messages from history

**`getMessages(): Message[]`**
- Get current message history

#### Observables

**`messages$: Observable<Message[]>`**
- Stream of all messages

**`isProcessing$: Observable<boolean>`**
- Whether a request is currently processing

**`connectionStatus$: Observable<ConnectionStatus>`**
- WebSocket connection status ('disconnected' | 'connecting' | 'connected' | 'error')

**`errors$: Observable<string>`**
- Stream of error messages

**`events$: Observable<ChatEvent>`**
- General event stream (open, close, messageReceived, error, connectionStatusChanged)

### ChatComponent

#### Inputs

- `config?: Partial<ChatConfig>` - Service configuration
- `isOpen?: boolean` - Whether chat is open

#### Outputs

- `isOpenChange: EventEmitter<boolean>` - Chat open/close state changes
- `messageReceived: EventEmitter<Message>` - Fired when assistant message is received
- `error: EventEmitter<any>` - Fired when an error occurs

#### Methods (Public API)

- `openChat(): void` - Open the chat window
- `closeChat(): void` - Close the chat window
- `toggleChat(): void` - Toggle chat open/close

## HTTP Mode

### Request Format

```typescript
POST /api/chat
Content-Type: application/json

{
  "sessionId": "session_123",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "stream": false
}
```

### Response Format (Non-Streaming)

```typescript
{
  "message": {
    "id": "msg_2",
    "role": "assistant",
    "content": "Hello! How can I help?",
    "createdAt": "2024-01-01T12:00:01.000Z"
  },
  "sessionId": "session_123"
}
```

### Streaming Response (SSE)

For streaming, the backend should return Server-Sent Events:

```
Content-Type: text/event-stream

data: {"delta":"Hello","complete":false,"messageId":"msg_2"}
data: {"delta":"!","complete":false,"messageId":"msg_2"}
data: {"delta":" How","complete":false,"messageId":"msg_2"}
data: {"delta":" can","complete":false,"messageId":"msg_2"}
data: {"delta":" I","complete":false,"messageId":"msg_2"}
data: {"delta":" help?","complete":true,"messageId":"msg_2"}
```

Use `sendMessageStream()` method for streaming:

```typescript
chatService.sendMessageStream('Hello').subscribe({
  next: (delta) => {
    console.log('Received delta:', delta);
  },
  complete: () => {
    console.log('Stream complete');
  },
});
```

## WebSocket Mode

### Connection

```
wss://api.example.com/chat?sessionId=session_123
```

### Client → Server

```json
{
  "type": "send",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Server → Client (Streaming)

**Delta messages:**
```json
{
  "type": "delta",
  "delta": "Hello",
  "messageId": "msg_2",
  "complete": false
}
```

**Final message:**
```json
{
  "type": "done",
  "message": {
    "id": "msg_2",
    "role": "assistant",
    "content": "Hello! How can I help?",
    "createdAt": "2024-01-01T12:00:01.000Z"
  }
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Error message here"
}
```

## Events & Outputs

### Component Events

```typescript
// Listen to message received
<app-chat (messageReceived)="onMessage($event)"></app-chat>

// Listen to errors
<app-chat (error)="onError($event)"></app-chat>

// Two-way binding for open state
<app-chat [(isOpen)]="chatOpen"></app-chat>
```

### Service Events

```typescript
chatService.events$.subscribe(event => {
  switch (event.type) {
    case 'open':
      console.log('Chat opened');
      break;
    case 'close':
      console.log('Chat closed');
      break;
    case 'messageReceived':
      console.log('Message:', event.data);
      break;
    case 'error':
      console.error('Error:', event.data);
      break;
    case 'connectionStatusChanged':
      console.log('Status:', event.data);
      break;
  }
});
```

## Styling & Theming

The component uses CSS variables that automatically adapt to your theme:

- `--accent-color`: Primary accent color
- `--card-dark` / `--card-light`: Message background
- `--text-dark` / `--text-light`: Text colors
- `--border-dark` / `--border-light`: Border colors

The component automatically detects `body.dark` and `body.light` classes for theming.

### Custom Styling

You can override styles in your global stylesheet:

```scss
app-chat {
  .chat-window {
    // Custom window styles
  }
  
  .chat-message {
    // Custom message styles
  }
}
```

## Accessibility

The component includes:
- **ARIA labels** on all interactive elements
- **Keyboard navigation** (Enter to send, Shift+Enter for newline)
- **Screen reader support** with `aria-live` regions
- **Focus management** when opening/closing
- **High contrast mode** support
- **Reduced motion** support

## Mock Server for Development

See `chat.mock-server.ts` for mock implementations. For local development:

1. **HTTP Mock**: Use the `MockChatServer` service
2. **WebSocket Mock**: Run a separate Node.js server (see comments in `chat.mock-server.ts`)

### Using Mock Server

```typescript
import { MockChatServer } from './chat/chat.mock-server';

// In your component or service
if (environment.production === false) {
  chatService.setConfig({
    mode: 'http',
    endpoint: '/api/chat-mock', // Your mock endpoint
  });
}
```

## Examples

### Example 1: Simple Integration

```typescript
import { Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent],
  template: `
    <app-chat
      [config]="{
        mode: 'http',
        endpoint: '/api/chat'
      }"
    ></app-chat>
  `,
})
export class HomeComponent {}
```

### Example 2: With Event Handling

```typescript
import { Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';
import { Message } from './chat/chat.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent],
  template: `
    <app-chat
      [config]="chatConfig"
      [(isOpen)]="isOpen"
      (messageReceived)="handleMessage($event)"
      (error)="handleError($event)"
    ></app-chat>
  `,
})
export class HomeComponent {
  isOpen = false;
  
  chatConfig = {
    mode: 'http' as const,
    endpoint: '/api/chat',
    enableLocalStorage: true,
  };

  handleMessage(message: Message) {
    console.log('New message:', message);
    // Do something with the message
  }

  handleError(error: any) {
    console.error('Chat error:', error);
    // Show error notification
  }
}
```

### Example 3: Programmatic Control

```typescript
import { Component, ViewChild } from '@angular/core';
import { ChatComponent } from './chat/chat.component';
import { ChatService } from './chat/chat.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent],
  template: `
    <button (click)="openChat()">Open Chat</button>
    <app-chat #chat></app-chat>
  `,
})
export class HomeComponent {
  @ViewChild('chat') chatComponent!: ChatComponent;
  
  constructor(private chatService: ChatService) {
    chatService.setConfig({
      mode: 'websocket',
      endpoint: 'wss://api.example.com/chat',
    });
    chatService.connect();
  }

  openChat() {
    this.chatComponent.openChat();
  }
}
```

### Example 4: Custom Backend Integration

```typescript
import { Injectable } from '@angular/core';
import { ChatService } from './chat/chat.service';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CustomChatService extends ChatService {
  constructor(http: HttpClient) {
    super();
    // Override or extend methods as needed
  }

  // Example: Custom message transformation
  sendMessage(text: string) {
    const transformedText = this.transformInput(text);
    return super.sendMessage(transformedText);
  }

  private transformInput(text: string): string {
    // Add custom preprocessing
    return text.trim().toLowerCase();
  }
}
```

## Troubleshooting

### Messages not appearing
- Check that `messages$` subscription is active
- Verify backend is returning correct format
- Check browser console for errors

### WebSocket not connecting
- Verify WebSocket URL is correct
- Check CORS settings on server
- Ensure WebSocket server is running

### Streaming not working
- For HTTP: Ensure backend supports SSE
- For WebSocket: Verify server sends delta messages
- Check network tab for connection issues

### Styling issues
- Ensure CSS variables are defined in your theme
- Check for conflicting styles
- Verify `body.dark` or `body.light` class is set

## Support

For issues or questions, please refer to the component source code or create an issue in your project repository.

