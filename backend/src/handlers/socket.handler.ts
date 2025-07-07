import { Server, Socket } from "socket.io";
import { MessageService } from "../services/message.service";

interface TypingData {
  userId: number;
  recipientId: number;
  userName: string;
}

interface UserSocket extends Socket {
  userId?: number;
}

export class SocketHandler {
  private typingUsers = new Map<string, Map<number, any>>(); // roomId -> Map<userId, timeout>

  constructor(private io: Server, private messageService: MessageService) {}

  /**
   * Generate a consistent room name for two users
   * Always returns the same room name regardless of order
   */
  private getRoomName(userId1: number, userId2: number): string {
    const [smaller, larger] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    return `conversation_${smaller}_${larger}`;
  }

  handleConnection(socket: UserSocket) {
    console.log("Client connected:", socket.id);

    // Handle user authentication/identification
    socket.on("user:identify", (userId: number) => {
      socket.userId = userId;

      console.log(`User ${userId} identified on socket ${socket.id}`);

      socket.emit("user:identified", { userId, socketId: socket.id });
    });

    // Handle joining a specific conversation
    socket.on(
      "conversation:join",
      (data: { userId: number; recipientId: number }) => {
        const roomName = this.getRoomName(data.userId, data.recipientId);
        socket.join(roomName);
        console.log(
          `User ${data.userId} (socket ${socket.id}) joined room ${roomName}`
        );

        // Notify the room that user joined (optional)
        socket.to(roomName).emit("user:joined", { userId: data.userId });
      }
    );

    // Handle leaving a conversation
    socket.on(
      "conversation:leave",
      (data: { userId: number; recipientId: number }) => {
        const roomName = this.getRoomName(data.userId, data.recipientId);
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room ${roomName}`);
      }
    );

    socket.on("message:send", (data) => {
      const newMessage = this.messageService.addMessage({
        senderId: data.senderId,
        recipientId: data.recipientId,
        content: data.content,
      });

      // Send only to users in this conversation room
      const roomName = this.getRoomName(data.senderId, data.recipientId);

      // Emit to all clients in the room (including sender)
      this.io.to(roomName).emit("message:new", newMessage);

      console.log(`Message sent in room ${roomName}:`, newMessage.id);
    });

    socket.on("typing:start", (data: TypingData) => {
      const roomName = this.getRoomName(data.userId, data.recipientId);

      // Initialize map for room if not exists
      if (!this.typingUsers.has(roomName)) {
        this.typingUsers.set(roomName, new Map());
      }

      const roomTypers = this.typingUsers.get(roomName)!;

      // Clear existing timeout for this user
      const existingTimeout = roomTypers.get(data.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set auto-stop timeout (5 seconds)
      const timeout = setTimeout(() => {
        roomTypers.delete(data.userId);
        // Notify only users in this room that user stopped typing
        socket.to(roomName).emit("typing:stop", {
          userId: data.userId,
          recipientId: data.recipientId,
        });
      }, 5000);

      roomTypers.set(data.userId, timeout);

      // Broadcast only to other users in this conversation room
      socket.to(roomName).emit("typing:start", data);
    });

    socket.on("typing:stop", (data: TypingData) => {
      const roomName = this.getRoomName(data.userId, data.recipientId);
      const roomTypers = this.typingUsers.get(roomName);

      if (roomTypers) {
        const timeout = roomTypers.get(data.userId);
        if (timeout) {
          clearTimeout(timeout);
          roomTypers.delete(data.userId);
        }
      }

      // Broadcast only to other users in this conversation room
      socket.to(roomName).emit("typing:stop", {
        userId: data.userId,
        recipientId: data.recipientId,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Clean up user mapping
      if (socket.userId) {
        // Clean up any typing states for this user
        this.typingUsers.forEach((roomTypers, roomName) => {
          const timeout = roomTypers.get(socket.userId!);
          if (timeout) {
            clearTimeout(timeout);
            roomTypers.delete(socket.userId!);

            // Notify room that user stopped typing
            socket.to(roomName).emit("typing:stop", {
              userId: socket.userId,
              recipientId: 0, // We don't know the recipient from room name alone
            });
          }
        });
      }
    });
  }
}
