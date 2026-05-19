import { Router } from 'express';
import * as AuthController from './auth.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from '@teamhub/shared';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.get('/me', requireAuth, AuthController.getMe);

export { router as authRouter };
