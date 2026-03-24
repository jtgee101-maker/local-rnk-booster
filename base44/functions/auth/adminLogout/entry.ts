import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function sha256Hash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getClientIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const sessionToken = body.session_token || '';
    const ip = await getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'No session token' }), { status: 400 });
    }

    // Hash the session token
    const sessionTokenHash = await sha256Hash(sessionToken);

    // Find and revoke session
    const sessions = await base44.asServiceRole.entities.AdminSession.filter({
      session_token_hash: sessionTokenHash,
      revoked: false
    });

    if (sessions.length > 0) {
      const session = sessions[0];
      await base44.asServiceRole.entities.AdminSession.update(session.id, {
        revoked: true,
        revoked_at: new Date().toISOString()
      });

      // Log logout
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: session.email,
        event_type: 'admin_logout',
        ip,
        user_agent: userAgent
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});