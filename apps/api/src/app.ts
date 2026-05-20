import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

import { env } from './config/env';
import appRouter from './appRouter';


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

// Base app router, includes all feature routers
app.use("", appRouter)

export { app };