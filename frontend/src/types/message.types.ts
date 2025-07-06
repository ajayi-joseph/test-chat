export interface Message {
  id: string | number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  type?: MessageType;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'system';

export interface MessageGroup {
  messages: Message[];
  showTimestamp: boolean;
}

export interface MessageSendPayload {
  senderId: number;
  recipientId: number;
  content: string;
  tempId?: string;
}

export type MessageInput = {
  senderId: number;
  recipientId: number;
  content: string;
};

export interface MessageUpdatePayload {
  messageId: string;
  status?: MessageStatus;
  content?: string;
}