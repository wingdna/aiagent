import { type ActionFunction } from 'react-router';
import { executeCommand } from '../utils/cli-engine';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { cmd } = (await request.json()) as { cmd?: string };
    if (!cmd || typeof cmd !== 'string') {
      return Response.json({ error: 'Command is required' }, { status: 400 });
    }

    const result = await executeCommand(cmd);
    
    // Add CORS headers for "headless" access if needed
    return Response.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('CLI API Error:', error);
    return Response.json({ error: 'Internal server error', type: 'error' }, { status: 500 });
  }
};

export const loader = () => {
  return Response.json({ message: 'CLI API is active. Use POST to execute commands.' });
};
