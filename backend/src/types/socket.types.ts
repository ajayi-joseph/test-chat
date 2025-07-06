import { Message, CreateMessageDto } from './message.types';

export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'typing:start': (data: TypingEventData) => void;
  'typing:stop': (data: TypingStopData) => void;
  'user:connected': (userId: string) => void;
  'user:disconnected': (userId: string) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: CreateMessageDto) => void;
  'typing:start': (data: TypingEventData) => void;
  'typing:stop': (data: TypingStopData) => void;
  'user:identify': (data: { userId: string }) => void;
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName?: string;
}

export interface TypingEventData {
  userId: number;
  recipientId: number;
  userName: string;
}

export interface TypingStopData {
  userId: number;
  recipientId: number;
}