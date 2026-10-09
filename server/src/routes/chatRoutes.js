import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { processChatMessage } from '../services/chatService.js';
import {
  listUserConversations,
  getUserConversationById,
  createConversation,
  deleteUserConversation
} from '../models/conversationModel.js';

const router = express.Router();

// Esquema de validación para enviar mensaje
const sendMessageSchema = z.object({
  messageText: z.string().min(1, 'El mensaje no puede estar vacío').max(2000, 'El mensaje es demasiado largo'),
  conversationId: z.string().optional().nullable()
});

// POST /api/chat/messages
router.post('/messages', requireAuth, chatLimiter, async (req, res, next) => {
  try {
    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { messageText, conversationId } = parseResult.data;
    const result = await processChatMessage({
      userId: req.user.userId,
      conversationId,
      messageText
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/conversations - Listar conversaciones del usuario autenticado
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const list = await listUserConversations(req.user.userId);
    return res.json({
      success: true,
      conversations: list
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/conversations - Iniciar nueva conversación
router.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const title = req.body?.title || 'Nueva conversación';
    const newConv = await createConversation(req.user.userId, title);
    return res.status(201).json({
      success: true,
      conversation: {
        id: newConv._id.toString(),
        title: newConv.title,
        createdAt: newConv.createdAt,
        updatedAt: newConv.updatedAt,
        messages: []
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/conversations/:id - Cargar conversación con aislamiento
router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const conv = await getUserConversationById(req.params.id, req.user.userId);
    if (!conv) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada o no pertenece a este usuario.'
      });
    }

    return res.json({
      success: true,
      conversation: conv
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chat/conversations/:id - Eliminar conversación
router.delete('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await deleteUserConversation(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada o no pertenece a este usuario.'
      });
    }

    return res.json({
      success: true,
      message: 'Conversación eliminada correctamente.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
