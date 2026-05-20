import { Router } from 'express';
import * as ChannelsController from './channels.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { attachWorkspaceContext } from '../../middleware/attachWorkspaceContext';
import { validate } from '../../middleware/validate';
import { createChannelSchema, updateChannelSchema } from '@teamhub/shared';
import channelMembersRouter from './channel-members.routes';

const router = Router();

router.use(requireAuth);

router.get('/:workspaceId', attachWorkspaceContext, ChannelsController.listChannels);
router.post('/:workspaceId', attachWorkspaceContext, validate(createChannelSchema), ChannelsController.createChannel);
router.get('/:workspaceId/:channelId', attachWorkspaceContext, ChannelsController.getChannel);
router.post('/:workspaceId/:channelId/join', attachWorkspaceContext, ChannelsController.joinChannel);
router.patch('/:workspaceId/:channelId', attachWorkspaceContext, validate(updateChannelSchema), ChannelsController.updateChannel);
router.delete('/:workspaceId/:channelId', attachWorkspaceContext, ChannelsController.deleteChannel);

// channel members nested routes
router.use('/:workspaceId/:channelId/members', channelMembersRouter);

export { router as channelsRouter };
