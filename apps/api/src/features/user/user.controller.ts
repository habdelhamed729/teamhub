import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import * as UserService from './user.service';

export const updateMe = async (req: Request, res: Response) => {
  try {
    const user = await UserService.updateUser(req.user!.sub, req.body);
    sendSuccess(res, { user });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await UserService.getUserProfile(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const users = await UserService.searchUsers(req.user!.sub, q, 10);
    sendSuccess(res, { users });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
