import * as DocumentsService from "./documents.service";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/response";

export const listDocuments = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params["workspaceId"]!;
    const userId = req.user!.sub;
    const documents = await DocumentsService.listDocuments(workspaceId, userId);
    sendSuccess(res, { documents });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const listArchivedDocuments = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params["workspaceId"]!;
    const userId = req.user!.sub;
    const documents = await DocumentsService.listArchivedDocuments(workspaceId, userId);
    sendSuccess(res, { documents });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const createDocument = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params["workspaceId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.createDocument(
      workspaceId,
      userId,
      req.body,
    );
    sendSuccess(res, { document }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const documentId = req.params["documentId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.getDocument(documentId, userId);
    sendSuccess(res, { document });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const documentId = req.params["documentId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.updateDocument(
      documentId,
      userId,
      req.body,
    );
    sendSuccess(res, { document });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const archiveDocument = async (req: Request, res: Response) => {
  try {
    const documentId = req.params["documentId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.archiveDocument(documentId, userId);
    sendSuccess(res, { document });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const restoreDocument = async (req: Request, res: Response) => {
  try {
    const documentId = req.params["documentId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.restoreDocument(documentId, userId);
    sendSuccess(res, { document });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const documentId = req.params["documentId"]!;
    const userId = req.user!.sub;
    const document = await DocumentsService.deleteDocument(documentId, userId);
    sendSuccess(res, { document });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? "Internal Server Error", e.status ?? 500);
  }
};
