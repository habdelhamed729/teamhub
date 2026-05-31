import { Request, Response } from "express";
import * as AttachmentsService from "./attachments.service";
import { uploadAttachmentSchema } from "@teamhub/shared";
import { sendSuccess, sendError } from "../../utils/response";

export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No file uploaded", 400);
      return;
    }

    // Parse target and target_id from request body (which is populated via multer for multipart forms)
    const validation = uploadAttachmentSchema.safeParse({
      target: req.body.target,
      target_id: req.body.target_id,
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      sendError(res, `Validation error: ${errorMsg}`, 400);
      return;
    }

    const { target, target_id } = validation.data;
    const userId = req.user!.sub;

    const attachment = await AttachmentsService.createAttachment(
      userId,
      target,
      target_id,
      req.file
    );

    sendSuccess(res, { attachment }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const getAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attachmentId } = req.params;
    if (!attachmentId) {
      sendError(res, "Missing attachment ID", 400);
      return;
    }

    const userId = req.user!.sub;
    const attachment = await AttachmentsService.getAttachment(attachmentId, userId);

    sendSuccess(res, { attachment });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attachmentId } = req.params;
    if (!attachmentId) {
      sendError(res, "Missing attachment ID", 400);
      return;
    }

    const userId = req.user!.sub;
    await AttachmentsService.deleteAttachment(attachmentId, userId);

    sendSuccess(res, { message: "Attachment deleted successfully" });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};
