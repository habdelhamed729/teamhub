import { requireAuth } from "@/middleware/requireAuth";
import { Router } from "express";
import * as DocumentsController from "./documents.controller";
import { attachWorkspaceContext } from "@/middleware/attachWorkspaceContext";
import { validate } from "@/middleware/validate";
import { createDocumentSchema, updateDocumentSchema } from "@teamhub/shared";

const router = Router();

router.use(requireAuth);

router
  .get(
    "/workspaces/:workspaceId/documents",
    attachWorkspaceContext,
    DocumentsController.listDocuments,
  )
  .post(
    "/workspaces/:workspaceId/documents",
    attachWorkspaceContext,
    validate(createDocumentSchema),
    DocumentsController.createDocument,
  )
  .get(
    "/workspaces/:workspaceId/documents/archived",
    attachWorkspaceContext,
    DocumentsController.listArchivedDocuments,
  )
  .get("/documents/:documentId", DocumentsController.getDocument)
  .patch(
    "/documents/:documentId",
    validate(updateDocumentSchema),
    DocumentsController.updateDocument,
  )
  .patch("/documents/:documentId/archive", DocumentsController.archiveDocument)
  .patch("/documents/:documentId/restore", DocumentsController.restoreDocument)
  .delete("/documents/:documentId", DocumentsController.deleteDocument);

export { router as documentsRouter };
