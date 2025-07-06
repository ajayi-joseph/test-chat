export interface User {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  status?: UserStatus;
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy',
}

export interface UserConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
}