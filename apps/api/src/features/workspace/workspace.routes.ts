import { Router } from 'express';
import * as WorkspaceController from './workspace.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { attachWorkspaceContext } from '../../middleware/attachWorkspaceContext';
import { validate } from '../../middleware/validate';
import { createWorkspaceSchema, updateWorkspaceSchema, updateMemberRoleSchema, joinWorkspaceSchema } from '@teamhub/shared';

const router = Router();

router.use(requireAuth);

// Root workspace routes
router.get('/', WorkspaceController.listWorkspaces);
router.post('/', validate(createWorkspaceSchema), WorkspaceController.createWorkspace);

// Workspace detail & settings (with context)
router.get('/:workspaceId', attachWorkspaceContext, WorkspaceController.getWorkspace);
router.patch('/:workspaceId', attachWorkspaceContext, validate(updateWorkspaceSchema), WorkspaceController.updateWorkspace);
router.delete('/:workspaceId', attachWorkspaceContext, WorkspaceController.deleteWorkspace);

export { router as workspaceRouter };


