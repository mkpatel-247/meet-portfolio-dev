/**
 * Chat Component Types and Interfaces
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sent' | 'delivered' | 'error' | 'processing' | 'partial';

export type TransportMode = 'http' | 'websocket';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Chat message interface
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO timestamp
  status?: MessageStatus;
  meta?: Record<string, any>;
  retryCount?: number;
  error?: string;
}

/**
 * HTTP Chat Request
 */
export interface ChatRequest {
  sessionId?: string;
  messages: Message[];
  stream?: boolean;
}

/**
 * HTTP Chat Response (non-streaming)
 */
export interface ChatResponse {
  message: Message;
  sessionId?: string;
}

/**
 * HTTP Streaming Response (SSE/chunked)
 */
export interface ChatStreamDelta {
  delta: string;
  complete?: boolean;
  messageId?: string;
}

/**
 * WebSocket Message Types
 */
export type WebSocketMessageType = 'send' | 'delta' | 'done' | 'error' | 'ping' | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  messages?: Message[];
  delta?: string;
  message?: Message;
  error?: string;
  messageId?: string;
  complete?: boolean;
}

/**
 * Chat Service Configuration
 */
export interface ChatConfig {
  mode: TransportMode;
  endpoint?: string; // HTTP endpoint or WebSocket URL
  sessionId?: string;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number; // Initial delay in ms
  enableLocalStorage?: boolean;
  maxStoredMessages?: number;
  rateLimitDelay?: number; // Minimum delay between sends in ms
  autoReconnect?: boolean;
  reconnectDelay?: number;
  reconnectMaxAttempts?: number;
}

/**
 * Chat Service State
 */
export interface ChatState {
  messages: Message[];
  connectionStatus: ConnectionStatus;
  isProcessing: boolean;
  currentRequestId?: string;
  error?: string;
}

/**
 * Chat Events for component communication
 */
export interface ChatEvent {
  type: 'open' | 'close' | 'messageReceived' | 'error' | 'connectionStatusChanged';
  data?: any;
}

