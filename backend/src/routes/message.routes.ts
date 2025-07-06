import { Router, Request, Response } from "express";
import { MessageService } from "../services/message.service";

export function createMessageRoutes(messageService: MessageService): Router {
  const router = Router();
  /**
   * Get messages for a conversation between two users
   * @route GET /api/messages
   * @queryParam userId - ID of the user requesting the messages
   * @queryParam recipientId - ID of the recipient user
   */
  
  router.get("/messages", (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const recipientId = parseInt(req.query.recipientId as string);

      if (isNaN(userId) || isNaN(recipientId)) {
        return res.status(400).json({
          error: "Invalid userId or recipientId",
        });
      }

      const messages = messageService.getConversation(userId, recipientId);

      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        error: "Failed to fetch messages",
      });
    }
  });

  return router;
}
