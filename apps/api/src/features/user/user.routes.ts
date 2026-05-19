import { Router } from 'express';
import * as UserController from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);

export { router as userRouter };
