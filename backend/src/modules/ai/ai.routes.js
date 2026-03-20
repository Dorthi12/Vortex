import express from "express";
import {
  sendMessage,
  createConversation,
  getConversationMessages,
  getUserConversations,
  deleteConversation,
} from "./ai.controller.js";

const router = express.Router();

router.post("/conversation", createConversation);
router.post("/", sendMessage);
router.get("/conversations", getUserConversations);
router.get("/conversation/:id/messages", getConversationMessages);
router.delete("/conversation/:id", deleteConversation);

export default router;
