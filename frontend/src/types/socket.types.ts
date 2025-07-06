import type { Message, MessageSendPayload, MessageUpdatePayload } from './message.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SocketEvents {
  // Message events
  'message:new': (message: Message) => void;
  'message:send': (data: MessageSendPayload) => void;
  'message:update': (data: MessageUpdatePayload) => void;
  'message:delete': (messageId: string) => void;
  'message:delivered': (messageId: string) => void;
  'message:read': (data: { messageId: string; userId: number }) => void;
  
  // Typing events
  'typing:start': (data: TypingEvent) => void;
  'typing:stop': (data: TypingEvent) => void;
  
  // Connection events
  'connection:status': (status: ConnectionStatus) => void;
  'connection:error': (error: SocketError) => void;
  
  // User events
  'user:online': (userId: number) => void;
  'user:offline': (userId: number) => void;
}

export interface TypingEvent {
  userId: number;
  chatId: string;
  timestamp: number;
}

export interface SocketError {
  code: string;
  message: string;
  details?: unknown;
}

export interface SocketConfig {
  url: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
  auth?: Record<string, any>;
}