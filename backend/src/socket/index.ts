import { Server } from "socket.io";
import { MessageService } from "../services/message.service";
import { SocketHandler } from "../handlers/socket.handler";
import { config } from "../config";

/**
 * Initialize and configure Socket.IO server with room-based architecture
 * @param io - Socket.IO server instance
 * @param messageService - Message service instance
 */
export function setupSocketIO(
  io: Server,
  messageService: MessageService
): void {
  // Configure Socket.IO middleware
  io.use((socket, next) => {
    console.log("Socket middleware: New connection attempt");

    
    next();
  });

  // Initialize handlers
  const socketHandler = new SocketHandler(io, messageService);

  // Handle connections
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socketHandler.handleConnection(socket);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Create Socket.IO server with configuration
 * @param httpServer - HTTP server instance
 * @returns Configured Socket.IO server
 */
export function createSocketServer(httpServer: any): Server {
  return new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });
}