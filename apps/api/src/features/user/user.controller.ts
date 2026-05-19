import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import * as UserService from './user.service';

export const updateMe = async (req: Request, res: Response) => {
  try {
    const user = await UserService.updateUser(req.user!.sub, req.body);
    sendSuccess(res, { user });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await UserService.getUserProfile(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};
