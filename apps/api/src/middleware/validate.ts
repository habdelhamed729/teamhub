import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../lib/response';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.errors
        .map((e: ZodError['errors'][number]) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      sendError(res, message, 422);
      return;
    }

    req.body = result.data; // replace with coerced/parsed values
    next();
  };
