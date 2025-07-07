export interface Message {
  id: string | number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}


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

