const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN!;

export const aiRequest = async (
  method: 'GET' | 'POST',
  path: string,
  workspaceId: string,
  userId: string,
  data?: any,
) => {
  const url = `${AI_SERVICE_URL}${path}`;
  
  const headers: Record<string, string> = {
    'X-Service-Token': AI_SERVICE_TOKEN,
    'X-Workspace-Id': workspaceId,
    'X-User-Id': userId,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `AI microservice returned status ${response.status}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.detail) {
        errorMessage = errJson.detail;
      }
    } catch {
      // Use fallback error message
    }
    throw Object.assign(new Error(errorMessage), { status: response.status });
  }

  return response.json();
};
