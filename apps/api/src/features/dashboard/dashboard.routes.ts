import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { attachWorkspaceContext } from '../../middleware/attachWorkspaceContext';

const router = Router();

router.use(requireAuth);

// GET /workspaces/:workspaceId/dashboard
router.get('/:workspaceId/dashboard', attachWorkspaceContext, getDashboardData);

export { router as dashboardRouter };
