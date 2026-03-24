// Error logging function for Base44
import { createClient } from 'npm:@base44/sdk@0.8.6';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const errorData = await req.json();
    const base44 = createClient({
      apiToken: Deno.env.get('BASE44_API_TOKEN')
    });

    // Store error in Base44
    await base44.entities.ErrorLog.create({
      type: errorData.type,
      message: errorData.message,
      stack: errorData.stack,
      context: errorData.context,
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    return Response.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
