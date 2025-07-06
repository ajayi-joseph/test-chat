export interface User {
  id: number;
  name: string;
  profile: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface UserTyping {
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface ChatParticipant extends User {
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}