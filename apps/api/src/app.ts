import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

import { env } from './config/env';
import { authRouter } from './features/auth/auth.routes';
import { workspaceRouter } from './features/workspace/workspace.routes';
import { userRouter } from './features/user/user.routes';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Features
app.use('/auth', authRouter);
app.use('/workspaces', workspaceRouter);
app.use('/users', userRouter);

export { app };