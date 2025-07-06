import express from "express";
import { createServer } from "http";
import cors from "cors";
import { config } from "./config";
import { MessageService } from "./services/message.service";
import { createMessageRoutes } from "./routes/message.routes";
import { createSocketServer, setupSocketIO } from "./socket";

const app = express();
const httpServer = createServer(app);

// Initialize services
const messageService = new MessageService();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api", createMessageRoutes(messageService));

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    socketRooms: io.sockets.adapter.rooms.size,
  });
});

// Initialize Socket.IO
const io = createSocketServer(httpServer);
setupSocketIO(io, messageService);

// Start server
const PORT = config.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
  console.log(`CORS enabled for: ${config.CORS_ORIGIN}`);
});