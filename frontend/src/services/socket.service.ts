import { io, Socket } from "socket.io-client";

type SocketCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private joinedConversations = new Set<string>();
  private isConnecting = false;

  connect(url: string = "http://localhost:3001", userId?: number): Socket {
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log("Socket connection already in progress");
      return this.socket!;
    }

    if (this.socket?.connected) {
      console.log("Socket already connected");
      
      // If userId provided and different from current, update it
      if (userId && userId !== this.currentUserId) {
        this.identify(userId);
      }
      
      return this.socket;
    }

    this.isConnecting = true;

    this.socket = io(url, {
      transports: ["websocket", "polling"],
    });

    // Set up connection event handlers
    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.isConnecting = false;
      
      // Identify user immediately after connection
      if (this.currentUserId) {
        this.identify(this.currentUserId);
      }
      
      // Rejoin conversations after reconnection
      if (this.joinedConversations.size > 0) {
        console.log("Rejoining conversations:", Array.from(this.joinedConversations));
        this.joinedConversations.forEach(conv => {
          const [userId, recipientId] = this.parseConversationKey(conv);
          if (userId && recipientId) {
            // Re-emit the join event
            this.emit("conversation:join", { userId, recipientId });
          }
        });
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnecting = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnecting = false;
    });

    // If userId provided on connect, identify after connection
    if (userId) {
      this.currentUserId = userId;
      this.socket.on("connect", () => {
        if (userId === this.currentUserId) {
          this.identify(userId);
        }
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.joinedConversations.clear();
    }
  }

  /**
   * Identify the current user to the server
   */
  identify(userId: number): void {
    this.currentUserId = userId;
    this.emit("user:identify", userId);
  }

  /**
   * Join a conversation room
   */
  joinConversation(userId: number, recipientId: number): void {
    const key = this.getConversationKey(userId, recipientId);
    
    if (!this.joinedConversations.has(key)) {
      this.joinedConversations.add(key);
      
      if (this.socket?.connected) {
        this.emit("conversation:join", { userId, recipientId });
        console.log(`Joined conversation: ${key}`);
      } else {
        console.log(`Queued conversation join: ${key} (waiting for connection)`);
      }
    }
  }


  leaveConversation(userId: number, recipientId: number): void {
    const key = this.getConversationKey(userId, recipientId);
    
    if (this.joinedConversations.has(key)) {
      this.emit("conversation:leave", { userId, recipientId });
      this.joinedConversations.delete(key);
      console.log(`Left conversation: ${key}`);
    }
  }

  /**
   * Generate consistent conversation key
   */
  private getConversationKey(userId: number, recipientId: number): string {
    const [smaller, larger] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];
    return `${smaller}_${larger}`;
  }

  /**
   * Parse conversation key back to user IDs
   */
  private parseConversationKey(key: string): [number, number] | [null, null] {
    const parts = key.split('_');
    if (parts.length === 2) {
      return [parseInt(parts[0]), parseInt(parts[1])];
    }
    return [null, null];
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected");
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, callback: SocketCallback): void {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: SocketCallback): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentUserId(): number | null {
    return this.currentUserId;
  }

  // Message-related methods
  sendMessage(senderId: number, recipientId: number, content: string): void {
    // No need to join here - should already be in the room
    this.emit("message:send", { senderId, recipientId, content });
  }

  // Typing-related methods
  startTyping(userId: number, recipientId: number, userName: string): void {
    // Ensure we're in the conversation room
    this.joinConversation(userId, recipientId);
    
    this.emit("typing:start", { userId, recipientId, userName });
  }

  stopTyping(userId: number, recipientId: number): void {
    this.emit("typing:stop", { userId, recipientId });
  }

  onTypingStart(
    callback: (data: {
      userId: number;
      recipientId: number;
      userName: string;
    }) => void
  ): () => void {
    this.on("typing:start", callback);
    return () => this.off("typing:start", callback);
  }

  onTypingStop(
    callback: (data: { userId: number; recipientId: number }) => void
  ): () => void {
    this.on("typing:stop", callback);
    return () => this.off("typing:stop", callback);
  }

  // New message listener
  onNewMessage(callback: (message: any) => void): () => void {
    this.on("message:new", callback);
    return () => this.off("message:new", callback);
  }
}

export const socketService = new SocketService();