import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Sets admin session cookie via server-side Set-Cookie header (HttpOnly + Secure).
 * Call this from the frontend after verifying the magic link token.
 * Payload: { session_token, expires_at }
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { session_token, expires_at } = body;

    if (!session_token) {
      return new Response(JSON.stringify({ error: 'session_token required' }), { status: 400 });
    }

    // Validate the session exists in DB (hash-lookup)
    async function sha256Hash(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const tokenHash = await sha256Hash(session_token);
    const sessions = await base44.asServiceRole.entities.AdminSession.filter({
      session_token_hash: tokenHash,
      revoked: false
    });

    if (sessions.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const session = sessions[0];

    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    }

    // Calculate max-age in seconds
    const expiresDate = new Date(expires_at || session.expires_at);
    const maxAge = Math.max(0, Math.floor((expiresDate - Date.now()) / 1000));

    // Set cookie via response header — this is the ONLY way to set HttpOnly from server
    const cookieValue = `admin_session=${session_token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue
      }
    });

  } catch (error) {
    console.error('setAdminSession error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});