export interface User {
  id: number;
  name: string;
  profile: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}
