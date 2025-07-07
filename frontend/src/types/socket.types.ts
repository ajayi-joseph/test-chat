import type { Message, MessageSendPayload } from './message.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SocketEvents {
  // Message events
  'message:new': (message: Message) => void;
  'message:send': (data: MessageSendPayload) => void;
  
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