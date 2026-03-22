import prisma from "../../config/db.js";
import llm from "../../config/llm.js";
import { generateRAGResponse } from "../../services/rag.service.js";
export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
      },
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

const CONTEXT_LIMIT = 15;

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { conversationId, message } = req.body;

    if (!conversationId) {
      const newConversation = await prisma.conversation.create({
        data: {
          userId,
          title: message?.slice(0, 40) || "New Chat",
        },
      });

      conversationId = newConversation.id;
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or unauthorized");
    }
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: CONTEXT_LIMIT,
    });
    await prisma.message.create({
      data: {
        conversationId,
        role: "USER",
        content: message,
      },
    });

    const orderedMessages = messages.reverse();
    const history = orderedMessages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    }));
    const { reply, usedRag } = await generateRAGResponse({
      query: message,
      userId,
      history,
    });
    await prisma.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: reply,
      },
    });
    res.status(200).json({
      success: true,
      data: {
        reply,
        conversationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const nextCursor =
      conversations.length === limit
        ? conversations[conversations.length - 1].id
        : null;

    res.status(200).json({
      success: true,
      data: conversations,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: conversationId } = req.params;
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 20;

    await prisma.conversation.findFirstOrThrow({
      where: {
        id: conversationId,
        userId,
      },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        media: true,
      },
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    res.status(200).json({
      success: true,
      data: messages,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.conversation.findFirstOrThrow({
      where: {
        id,
        userId,
      },
    });

    await prisma.conversation.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
