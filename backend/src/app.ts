import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { messageRoutes } from "./routes/message.routes";
import { MessageService } from "./services/message.service";

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: "*" }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Initialize services
  const messageService = new MessageService();

  // Routes
  app.use("/api/messages", messageRoutes(messageService));

  // Future routes can be added here:
  // app.use("/api/users", userRoutes(userService));
  // app.use("/api/auth", authRoutes(authService));

  return { app, messageService };
}