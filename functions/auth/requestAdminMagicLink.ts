import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import crypto from 'node:crypto';

const ADMIN_ALLOWLIST = (Deno.env.get('ADMIN_ALLOWLIST') || 'jtgee101@gmail.com').split(',').map(e => e.trim().toLowerCase());
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_MAGIC_LINK_FROM_EMAIL = Deno.env.get('ADMIN_MAGIC_LINK_FROM_EMAIL') || 'admin@localrank.ai';
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://localrank.ai';

function generateSecureToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : req.headers.get('cf-connecting-ip') || 'unknown';
}

async function isRateLimited(base44, email, ip) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const emailAttempts = await base44.asServiceRole.entities.AdminAuthAuditLog.filter({
    email: email,
    event_type: 'magic_link_requested',
    created_date: { $gte: fifteenMinutesAgo.toISOString() }
  });
  
  if (emailAttempts.length >= 3) return true;
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const ipAttempts = await base44.asServiceRole.entities.AdminAuthAuditLog.filter({
    ip: ip,
    event_type: 'magic_link_requested',
    created_date: { $gte: oneHourAgo.toISOString() }
  });
  
  return ipAttempts.length >= 10;
}

async function sendMagicLinkEmail(email, magicLink) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalRank-Admin/1.0'
    },
    body: JSON.stringify({
      from: ADMIN_MAGIC_LINK_FROM_EMAIL,
      to: email,
      subject: 'Your secure admin sign-in link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Admin Sign-In</h2>
          <p>Use the secure link below to sign in to the Admin Control Center.</p>
          <p><a href="${magicLink}" style="background-color: #c8ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Sign in to Admin Control Center</a></p>
          <p style="color: #666; font-size: 12px;">
            This link expires in 10 minutes and can only be used once.<br/>
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Use this secure one-time link to sign in to the Admin Control Center:\n\n${magicLink}\n\nThis link expires in 10 minutes and can only be used once.\n\nIf you did not request this, ignore this email.`
    })
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status}`);
  }

  return response.json();
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
    const email = normalizeEmail(body.email || '');

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const isAllowlisted = ADMIN_ALLOWLIST.includes(email);

    // Log the request
    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: email,
      event_type: 'magic_link_requested',
      ip: clientIP,
      user_agent: userAgent
    });

    // Always return generic success to prevent email enumeration
    if (!isAllowlisted) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Rate limit check
    if (await isRateLimited(base44, email, clientIP)) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email: email,
        event_type: 'magic_link_rate_limited',
        ip: clientIP,
        user_agent: userAgent,
        metadata: { reason: 'too_many_requests' }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const nonce = crypto.randomBytes(16).toString('hex');

    // Store token
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await base44.asServiceRole.entities.AdminMagicLinkToken.create({
      email: email,
      token_hash: tokenHash,
      nonce: nonce,
      expires_at: expiresAt.toISOString(),
      used: false,
      revoked: false,
      requested_ip: clientIP,
      requested_user_agent: userAgent
    });

    // Build callback URL
    const magicLink = `${APP_BASE_URL}/admin-auth/callback?token=${rawToken}`;

    // Send email
    await sendMagicLinkEmail(email, magicLink);

    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email: email,
      event_type: 'magic_link_sent',
      ip: clientIP,
      user_agent: userAgent
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'If that email is authorized, a secure sign-in link has been sent.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in requestAdminMagicLink:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});