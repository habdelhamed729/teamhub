import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { addChannelMemberSchema } from '@teamhub/shared';
import * as Controller from './channel-members.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', Controller.listChannelMembers);
router.post('/', validate(addChannelMemberSchema), Controller.addChannelMember);

export default router;