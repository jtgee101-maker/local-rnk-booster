import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function isAllowlisted(email) {
  const envList = Deno.env.get('ADMIN_ALLOWLIST');
  const allowlist = envList
    ? envList.split(',').map(e => e.trim().toLowerCase())
    : ['jtgee101@gmail.com'];
  return allowlist.includes(email.toLowerCase());
}

function generateSecureToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

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
    const rawToken = body.token || '';
    const ip = await getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!rawToken) {
      return new Response(JSON.stringify({ status: 'invalid' }), { status: 400 });
    }

    // Hash the incoming token
    const tokenHash = await sha256Hash(rawToken);

    // Find token record by hash
    const tokenRecords = await base44.asServiceRole.entities.AdminMagicLinkToken.filter({
      token_hash: tokenHash
    });

    if (tokenRecords.length === 0) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: 'unknown',
        event_type: 'magic_link_invalid',
        ip,
        user_agent: userAgent,
        metadata: { reason: 'token_not_found' }
      });
      return new Response(JSON.stringify({ status: 'invalid' }), { status: 400 });
    }

    const token = tokenRecords[0];

    // Check if used or revoked
    if (token.used || token.revoked) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: token.email,
        event_type: 'magic_link_invalid',
        ip,
        user_agent: userAgent,
        metadata: { reason: token.used ? 'already_used' : 'revoked' }
      });
      return new Response(JSON.stringify({ status: 'invalid' }), { status: 400 });
    }

    // Check if expired
    if (new Date(token.expires_at) < new Date()) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: token.email,
        event_type: 'magic_link_expired',
        ip,
        user_agent: userAgent
      });
      return new Response(JSON.stringify({ status: 'expired' }), { status: 400 });
    }

    // Re-check allowlist
    if (!isAllowlisted(token.email)) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: token.email,
        event_type: 'magic_link_invalid',
        ip,
        user_agent: userAgent,
        metadata: { reason: 'not_allowlisted' }
      });
      return new Response(JSON.stringify({ status: 'invalid' }), { status: 400 });
    }

    // Mark token as used
    await base44.asServiceRole.entities.AdminMagicLinkToken.update(token.id, {
      used: true,
      used_at: new Date().toISOString(),
      consumed_ip: ip,
      consumed_user_agent: userAgent
    });

    // Create session token
    const rawSessionToken = generateSecureToken();
    const sessionTokenHash = await sha256Hash(rawSessionToken);
    const sessionTTLHours = parseInt(Deno.env.get('ADMIN_SESSION_TTL_HOURS') || '12');
    const expiresAt = new Date(Date.now() + sessionTTLHours * 60 * 60 * 1000).toISOString();

    // Store session
    const session = await base44.asServiceRole.entities.AdminSession.create({
      email: token.email,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt,
      revoked: false,
      created_ip: ip,
      created_user_agent: userAgent,
      last_seen_at: new Date().toISOString()
    });

    // Log success
    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: token.email,
      event_type: 'magic_link_verified',
      ip,
      user_agent: userAgent
    });

    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: token.email,
      event_type: 'admin_login_success',
      ip,
      user_agent: userAgent
    });

    return new Response(JSON.stringify({
      status: 'success',
      session_token: rawSessionToken,
      session_id: session.id,
      expires_at: expiresAt
    }), { status: 200 });
  } catch (error) {
    console.error('Verify magic link error:', error);
    return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
  }
});