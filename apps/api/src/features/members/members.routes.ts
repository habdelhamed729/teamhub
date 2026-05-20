import {Router} from 'express';
import {attachWorkspaceContext} from '../../middleware/attachWorkspaceContext';
import {requireAuth} from '../../middleware/requireAuth';
import {validate} from '../../middleware/validate';
import * as MembersController from './members.controller';
import {addMemberSchema, updateMemberSchema} from './members.schema';

const router = Router();

router.use(requireAuth);

// List members for a workspace
router.get('/:workspaceId/members', attachWorkspaceContext, MembersController.listMembers);

// Add a member directly (admin/owner action)
router.post('/:workspaceId/members', attachWorkspaceContext, validate(addMemberSchema), MembersController.addMember);

// Update a member role
router.patch('/:workspaceId/members/:userId', attachWorkspaceContext, validate(updateMemberSchema), MembersController.updateMemberRole);

// Remove a member
router.delete('/:workspaceId/members/:userId', attachWorkspaceContext, MembersController.removeMember);

export {router as membersRouter};

