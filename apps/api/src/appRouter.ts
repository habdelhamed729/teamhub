import { Router } from 'express';
import { authRouter } from './features/auth/auth.routes';
import { workspaceRouter } from './features/workspace/workspace.routes';
import { userRouter } from './features/user/user.routes';
import { membersRouter } from './features/members/members.routes';
import { channelsRouter } from './features/channels/channels.routes';
import { notificationsRouter } from './features/notifications/notifications.routes';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/workspaces', workspaceRouter);
appRouter.use('/users', userRouter);
appRouter.use('/workspaces', membersRouter);
appRouter.use('/channels', channelsRouter);
appRouter.use('/notifications', notificationsRouter);

export default appRouter