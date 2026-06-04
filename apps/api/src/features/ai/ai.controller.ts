import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../database/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { getDocument } from '../documents/documents.service';
import * as AIService from './ai.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN!;

/** Verify that a user belongs to a workspace, throws 403 on denial */
const verifyWorkspaceMember = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: { workspace_id: workspaceId, user_id: userId },
    },
  });

  if (!membership) {
    throw Object.assign(new Error('Workspace not found or access denied'), { status: 403 });
  }
};

export const documentQA = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.sub;
    const { question } = req.body;

    if (!question) {
      return sendError(res, 'Question is required', 400);
    }

    // Verify document access
    const doc = await getDocument(documentId, userId);

    const result = await AIService.aiRequest(
      'POST',
      `/documents/${documentId}/qa`,
      doc.workspace_id,
      userId,
      { question },
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Service QA failed', err.status ?? 500);
  }
};

export const summarize = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.sub;
    const { length } = req.body;

    // Verify document access
    const doc = await getDocument(documentId, userId);

    const result = await AIService.aiRequest(
      'POST',
      `/documents/${documentId}/summarize`,
      doc.workspace_id,
      userId,
      { length: length || 'medium' },
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Service Summarization failed', err.status ?? 500);
  }
};

export const generateTags = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.sub;

    // Verify document access
    const doc = await getDocument(documentId, userId);

    const result = await AIService.aiRequest(
      'POST',
      `/documents/${documentId}/generate-tags`,
      doc.workspace_id,
      userId,
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Service Tagging failed', err.status ?? 500);
  }
};

export const generateTitle = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.sub;

    // Verify document access
    const doc = await getDocument(documentId, userId);

    const result = await AIService.aiRequest(
      'POST',
      `/documents/${documentId}/generate-title`,
      doc.workspace_id,
      userId,
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Service Titling failed', err.status ?? 500);
  }
};

export const extractActions = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.sub;

    // Verify document access
    const doc = await getDocument(documentId, userId);

    const result = await AIService.aiRequest(
      'POST',
      `/documents/${documentId}/extract-actions`,
      doc.workspace_id,
      userId,
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Service Extraction failed', err.status ?? 500);
  }
};

export const semanticSearch = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.sub;
    const { query, limit, similarity_threshold } = req.body;

    if (!query) {
      return sendError(res, 'Query is required', 400);
    }

    // Verify workspace membership
    await verifyWorkspaceMember(workspaceId, userId);

    const result = await AIService.aiRequest(
      'POST',
      '/search/semantic',
      workspaceId,
      userId,
      {
        query,
        limit: limit || 10,
        similarity_threshold: similarity_threshold !== undefined ? similarity_threshold : 0.35,
      },
    );

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message ?? 'AI Semantic Search failed', err.status ?? 500);
  }
};

export const getStreamToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { action, documentId, payload } = req.body;

    if (!action || !documentId) {
      return sendError(res, 'Action and documentId are required', 400);
    }

    if (action !== 'qa' && action !== 'summarize') {
      return sendError(res, 'Invalid action. Must be qa or summarize', 400);
    }

    // Verify document access
    const doc = await getDocument(documentId, userId);

    // Create stream payload
    const exp = Math.floor(Date.now() / 1000) + 300; // 5 minute expiry
    const streamPayload = {
      workspace_id: doc.workspace_id,
      user_id: userId,
      document_id: documentId,
      action,
      payload: payload || {},
      exp,
    };

    // Serialize and base64url encode payload
    const payloadStr = JSON.stringify(streamPayload);
    const payloadB64 = Buffer.from(payloadStr).toString('base64url');

    // Create HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', AI_SERVICE_TOKEN)
      .update(payloadB64)
      .digest('hex');

    const token = `${payloadB64}.${signature}`;
    const streamId = crypto.randomUUID();

    sendSuccess(res, {
      token,
      url: `${AI_SERVICE_URL}/stream/${streamId}?token=${token}`,
    });
  } catch (err: any) {
    sendError(res, err.message ?? 'Failed to generate stream token', err.status ?? 500);
  }
};
