export interface Message {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}

export interface CreateMessageDto {
  senderId: number;
  recipientId: number;
  content: string;
}

export enum MessageType {
  SYSTEM = 0,
  USER = 1,
}