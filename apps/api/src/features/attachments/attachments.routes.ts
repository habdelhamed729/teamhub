import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import * as AttachmentsController from "./attachments.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { sendError } from "../../utils/response";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@teamhub/shared";

const router = Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

router.use(requireAuth);

// POST /uploads - Upload file and link to a target message/document/task
router.post("/", upload.single("file"), AttachmentsController.uploadAttachment);

// GET /attachments/:attachmentId - Get attachment metadata
router.get("/:attachmentId", AttachmentsController.getAttachment);

// DELETE /attachments/:attachmentId - Delete attachment
router.delete("/:attachmentId", AttachmentsController.deleteAttachment);

// ─── Multer Error Handler ───────────────────────────────────────────────────
// Must be defined after routes so Express recognizes it as an error middleware.
router.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`, 413);
    }
    return sendError(res, err.message, 400);
  }
  if (err?.message?.includes("not allowed")) {
    return sendError(res, err.message, 415);
  }
  next(err);
});

export { router as attachmentsRouter };
