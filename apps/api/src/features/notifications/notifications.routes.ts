import { Router } from 'express';
import * as NotificationsController from './notifications.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationsController.listNotifications);

router.patch('/:notificationId/read', NotificationsController.markAsRead);

router.patch('/read-all', NotificationsController.markAllAsRead);

export { router as notificationsRouter };
