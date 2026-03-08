import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import crypto from 'node:crypto';

const ADMIN_ALLOWLIST = (Deno.env.get('ADMIN_ALLOWLIST') || 'jtgee101@gmail.com').split(',').map(e => e.trim().toLowerCase());
const ADMIN_SESSION_TTL_HOURS = parseInt(Deno.env.get('ADMIN_SESSION_TTL_HOURS') || '12');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSecureSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : req.headers.get('cf-connecting-ip') || 'unknown';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const clientIP = await getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const body = await req.json();
    const rawToken = body.token || '';

    if (!rawToken) {
      return new Response(JSON.stringify({
        success: false,
        reason: 'invalid',
        message: 'Invalid or missing token.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Hash incoming token
    const tokenHash = hashToken(rawToken);

    // Find token record
    const tokenRecords = await base44.asServiceRole.entities.AdminMagicLinkToken.filter({
      token_hash: tokenHash
    });

    if (tokenRecords.length === 0) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: 'unknown',
        event_type: 'magic_link_invalid',
        ip: clientIP,
        user_agent: userAgent,
        metadata: { reason: 'token_not_found' }
      });

      return new Response(JSON.stringify({
        success: false,
        reason: 'invalid',
        message: 'This sign-in link is invalid or has already been used.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const tokenRecord = tokenRecords[0];
    const email = tokenRecord.email;

    // Check if already used
    if (tokenRecord.used) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: email,
        event_type: 'magic_link_invalid',
        ip: clientIP,
        user_agent: userAgent,
        metadata: { reason: 'already_used' }
      });

      return new Response(JSON.stringify({
        success: false,
        reason: 'invalid',
        message: 'This sign-in link has already been used.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if revoked
    if (tokenRecord.revoked) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: email,
        event_type: 'magic_link_invalid',
        ip: clientIP,
        user_agent: userAgent,
        metadata: { reason: 'revoked' }
      });

      return new Response(JSON.stringify({
        success: false,
        reason: 'invalid',
        message: 'This sign-in link is no longer valid.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: email,
        event_type: 'magic_link_expired',
        ip: clientIP,
        user_agent: userAgent
      });

      return new Response(JSON.stringify({
        success: false,
        reason: 'expired',
        message: 'This sign-in link has expired. Please request a new one.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check allowlist
    if (!ADMIN_ALLOWLIST.includes(email)) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: email,
        event_type: 'magic_link_invalid',
        ip: clientIP,
        user_agent: userAgent,
        metadata: { reason: 'not_allowlisted' }
      });

      return new Response(JSON.stringify({
        success: false,
        reason: 'invalid',
        message: 'This email is not authorized for admin access.'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Mark token as used
    await base44.asServiceRole.entities.AdminMagicLinkToken.update(tokenRecord.id, {
      used: true,
      used_at: new Date().toISOString(),
      consumed_ip: clientIP,
      consumed_user_agent: userAgent
    });

    // Create admin session
    const rawSessionToken = generateSecureSessionToken();
    const sessionTokenHash = hashToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await base44.asServiceRole.entities.AdminSession.create({
      email: email,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt.toISOString(),
      revoked: false,
      created_ip: clientIP,
      created_user_agent: userAgent,
      last_seen_at: new Date().toISOString()
    });

    // Log success
    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: email,
      event_type: 'magic_link_verified',
      ip: clientIP,
      user_agent: userAgent
    });

    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: email,
      event_type: 'admin_login_success',
      ip: clientIP,
      user_agent: userAgent
    });

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      session_token: rawSessionToken,
      email: email,
      expires_at: expiresAt.toISOString(),
      redirect: '/LaunchCommandCenter'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in verifyAdminMagicLink:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});