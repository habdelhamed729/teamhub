import { Router } from 'express';
import * as MessagesController from './messages.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import {
  createMessageSchema,
  updateMessageSchema,
  messageReactionSchema,
} from '@teamhub/shared';

const router = Router();

router.use(requireAuth);

// ─── Channel-scoped message routes ───────────────────────────────────────────
// Mounted at /channels/:channelId/messages

// GET — cursor/limit parsed directly from req.query in the controller
router.get('/:channelId/messages', MessagesController.listMessages);

router.post(
  '/:channelId/messages',
  validate(createMessageSchema.omit({ channelId: true })),
  MessagesController.createMessage,
);

// ─── Message-scoped routes ────────────────────────────────────────────────────
// Mounted at /messages

router.patch(
  '/:messageId',
  validate(updateMessageSchema.omit({ messageId: true })),
  MessagesController.updateMessage,
);

router.delete('/:messageId', MessagesController.deleteMessage);

// Reactions
router.post(
  '/:messageId/reactions',
  validate(messageReactionSchema.omit({ messageId: true })),
  MessagesController.addReaction,
);

router.delete(
  '/:messageId/reactions/:emoji',
  MessagesController.removeReaction,
);

// GET — cursor/limit parsed directly from req.query in the controller
router.get('/:messageId/replies', MessagesController.listReplies);

router.post(
  '/:messageId/replies',
  validate(createMessageSchema.omit({ channelId: true })),
  MessagesController.createReply,
);

export { router as messagesRouter };
