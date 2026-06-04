import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}`;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key';

async function testProxy() {
  console.log('--- STARTING AI END-TO-END PROXY INTEGRATION TEST ---');

  // 1. Fetch real user, document and workspace from database to verify constraints
  const doc = await prisma.document.findFirst({
    where: {
      is_archived: false,
    },
    include: {
      workspace: true,
    },
  });

  if (!doc) {
    console.error('[Error] No active document found in database to run proxy tests.');
    return;
  }

  // Fetch a user who is a member of the document's workspace
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspace_id: doc.workspace_id,
    },
    include: {
      user: true,
    },
  });

  if (!member) {
    console.error(`[Error] No workspace member found for workspace ${doc.workspace_id}.`);
    return;
  }

  const user = member.user;
  console.log(`Found Test Data:`);
  console.log(`  - Document:  ${doc.title} (${doc.id})`);
  console.log(`  - Workspace: ${doc.workspace.name} (${doc.workspace_id})`);
  console.log(`  - User:      ${user.display_name} (${user.id})`);

  // 2. Generate a valid JWT token for the user
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Helper for requests
  const postRequest = async (path: string, body?: any) => {
    const url = `${API_URL}${path}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      console.log(`POST ${path} -> Status: ${response.status}`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (e: any) {
      console.error(`POST ${path} failed: ${e.message}`);
      return null;
    }
  };

  // 3. Test Title Generation
  console.log('\n--- 1. Testing Title Generation ---');
  const titleRes = await postRequest(`/ai/documents/${doc.id}/generate-title`);
  console.log('Result:', JSON.stringify(titleRes));

  // 4. Test Tag Generation
  console.log('\n--- 2. Testing Tag Generation ---');
  const tagRes = await postRequest(`/ai/documents/${doc.id}/generate-tags`);
  console.log('Result:', JSON.stringify(tagRes));

  // 5. Test Summarization
  console.log('\n--- 3. Testing Summarization ---');
  const sumRes = await postRequest(`/ai/documents/${doc.id}/summarize`, { length: 'short' });
  console.log('Result:', JSON.stringify(sumRes));

  // 6. Test Document Q&A (RAG)
  console.log('\n--- 4. Testing Document Q&A (RAG) ---');
  const qaRes = await postRequest(`/ai/documents/${doc.id}/qa`, { question: 'What is semantic search?' });
  console.log('Result:', JSON.stringify(qaRes));

  // 7. Test Action Item Extraction
  console.log('\n--- 5. Testing Action Item Extraction ---');
  const extRes = await postRequest(`/ai/documents/${doc.id}/extract-actions`);
  console.log('Result:', JSON.stringify(extRes));

  // 8. Test Semantic Search
  console.log('\n--- 6. Testing Workspace Semantic Search ---');
  const searchRes = await postRequest(`/ai/workspaces/${doc.workspace_id}/search`, { query: 'vector similarity' });
  console.log('Result:', JSON.stringify(searchRes));

  // 9. Test Stream Token Generation & SSE Streaming
  console.log('\n--- 7. Testing SSE Streaming (Q&A) ---');
  const streamTokenRes = await postRequest('/ai/stream/token', {
    action: 'qa',
    documentId: doc.id,
    payload: { question: 'Explain cosine similarity' }
  });
  console.log('Stream Token Result:', JSON.stringify(streamTokenRes));

  if (streamTokenRes && streamTokenRes.data && streamTokenRes.data.url) {
    const streamUrl = streamTokenRes.data.url;
    console.log(`\nOpening SSE Connection to FastAPI stream URL: ${streamUrl}`);
    
    try {
      const response = await fetch(streamUrl);
      console.log(`SSE Connection status: ${response.status}`);
      if (response.ok && response.body) {
        // Read the readable stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let finished = false;
        
        console.log('\nStreaming tokens:');
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) {
            finished = true;
            break;
          }
          const chunkStr = decoder.decode(value, { stream: true });
          // Format output to show events nicely
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(5).trim());
                if (data.content) {
                  process.stdout.write(data.content);
                } else if (data.chunks) {
                  console.log(`\n[Sources Received: ${data.chunks.length} chunks]`);
                } else {
                  console.log(`\n[SSE Event: ${line}]`);
                }
              } catch {
                console.log(`\n[SSE Data Line]: ${line}`);
              }
            } else if (line.trim() && !line.startsWith('event:')) {
              console.log(`\n[SSE line]: ${line}`);
            }
          }
        }
        console.log('\n\n--- Streaming Completed ---');
      } else {
        console.error('Failed to open stream connection');
      }
    } catch (e: any) {
      console.error(`Streaming failed: ${e.message}`);
    }
  }

  console.log('\n--- AI PROXY INTEGRATION TEST FINISHED ---');
}

testProxy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unhandled test failure:', err);
    process.exit(1);
  });
