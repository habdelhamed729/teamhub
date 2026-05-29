import { Router } from 'express';
import { authRouter } from './features/auth/auth.routes';
import { workspaceRouter } from './features/workspace/workspace.routes';
import { userRouter } from './features/user/user.routes';
import { membersRouter } from './features/members/members.routes';
import { channelsRouter } from './features/channels/channels.routes';
import { notificationsRouter } from './features/notifications/notifications.routes';
import { messagesRouter } from './features/messages/messages.routes';
import { documentsRouter } from './features/documents/documents.routes';
import { attachmentsRouter } from './features/attachments/attachments.routes';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/workspaces', workspaceRouter);
appRouter.use('/users', userRouter);
appRouter.use('/workspaces', membersRouter);
// messagesRouter must be registered before channelsRouter — both match /channels/:id/messages
appRouter.use('/channels', messagesRouter);
appRouter.use('/channels', channelsRouter);
appRouter.use('/messages', messagesRouter); // PATCH/DELETE /messages/:messageId, reactions, replies
appRouter.use('/notifications', notificationsRouter);
appRouter.use('/uploads', attachmentsRouter);
appRouter.use('/attachments', attachmentsRouter);
appRouter.use("", documentsRouter);


export default appRouter;
