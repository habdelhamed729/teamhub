import { Request, Response } from 'express';
import { getDashboardData as fetchDashboardData } from './dashboard.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const userId = req.user!.sub;

    const data = await fetchDashboardData(workspaceId, userId);
    sendSuccess(res, data);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
