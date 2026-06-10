import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as AIController from './ai.controller';

const router = Router();
router.use(requireAuth);

// Document AI Endpoints
router.post('/documents/:documentId/qa', AIController.documentQA);
router.post('/documents/:documentId/summarize', AIController.summarize);
router.post('/documents/:documentId/generate-tags', AIController.generateTags);
router.post('/documents/:documentId/generate-title', AIController.generateTitle);
router.post('/documents/:documentId/extract-actions', AIController.extractActions);

// Semantic Search Endpoint
router.post('/workspaces/:workspaceId/search', AIController.semanticSearch);

// Streaming Token Endpoint
router.post('/stream/token', AIController.getStreamToken);

// LangGraph Workflow Endpoints
router.post('/workflows/document-tasks/start', AIController.startDocumentTasks);
router.post('/workflows/document-tasks/resume', AIController.resumeDocumentTasks);
router.get('/workflows/threads/:threadId/state', AIController.getWorkflowState);

export { router as aiRouter };

