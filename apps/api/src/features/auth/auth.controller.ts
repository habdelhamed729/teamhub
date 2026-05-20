import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
};

const ACCESS_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, access_token, refresh_token } = await AuthService.register(req.body);
    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { user }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, access_token, refresh_token } = await AuthService.login(req.body);
    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { user });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

// POST /auth/logout (requireAuth)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.logout(req.user!.sub);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

// POST /auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    if (!token) {
      sendError(res, 'No refresh token provided', 401);
      return;
    }
    const { user, access_token, refresh_token } = await AuthService.refresh(token);
    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { user });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Unauthorized', e.status ?? 401);
  }
};

// GET /auth/me  (requireAuth)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getMe(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
