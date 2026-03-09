import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function isAllowlisted(email) {
  const allowlist = (Deno.env.get('ADMIN_ALLOWLIST') || '').split(',').map(e => e.trim().toLowerCase());
  return allowlist.includes(email);
}

async function getClientIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
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

async function checkRateLimit(base44, email, ip) {
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const emailLogs = await base44.asServiceRole.entities.AdminAuthAuditLog.filter({
    email,
    event_type: { $in: ['magic_link_requested', 'magic_link_sent'] },
    created_date: { $gte: fifteenMinsAgo }
  });

  if (emailLogs.length >= 3) return { limited: true, reason: 'email' };

  const ipLogs = await base44.asServiceRole.entities.AdminAuthAuditLog.filter({
    ip,
    event_type: { $in: ['magic_link_requested', 'magic_link_sent'] },
    created_date: { $gte: oneHourAgo }
  });

  if (ipLogs.length >= 10) return { limited: true, reason: 'ip' };

  return { limited: false };
}

async function sendMagicLinkEmail(email, url) {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; background: #0a0a0f; color: #c8ff00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Secure Admin Sign-In</h1>
    </div>
    <p>Hi,</p>
    <p>Use the secure link below to sign in to the Admin Control Center.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${url}" class="button">Sign in to Admin Control Center</a>
    </p>
    <p><strong>Important:</strong></p>
    <ul>
      <li>This link expires in 10 minutes</li>
      <li>It can only be used once</li>
      <li>Do not forward this email</li>
    </ul>
    <p>If you did not request this, you can safely ignore this email.</p>
    <div class="footer">
      <p>— Security System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textBody = `Use this secure one-time link to sign in to the Admin Control Center:

${url}

This link expires in 10 minutes and can only be used once.

If you did not request this, ignore this email.`;

  return resend.emails.send({
    from: Deno.env.get('ADMIN_MAGIC_LINK_FROM_EMAIL') || 'admin@localrank.ai',
    to: email,
    subject: 'Your secure admin sign-in link',
    html: htmlBody,
    text: textBody
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const email = normalizeEmail(body.email || '');
    const ip = await getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200 });
    }

    // Log request
    await base44.asServiceRole.entities.AdminAuthAuditLog.create({
      email,
      event_type: 'magic_link_requested',
      ip,
      user_agent: userAgent
    });

    // Check allowlist
    if (!isAllowlisted(email)) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200 });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(base44, email, ip);
    if (rateLimit.limited) {
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email,
        event_type: 'magic_link_rate_limited',
        ip,
        user_agent: userAgent,
        metadata: { reason: rateLimit.reason }
      });
      return new Response(JSON.stringify({
        success: true,
        message: 'If that email is authorized, a secure sign-in link has been sent.'
      }), { status: 200 });
    }

    // Generate token
    const rawToken = generateSecureToken();
    const tokenHash = await sha256Hash(rawToken);
    const nonce = generateSecureToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store token
    await base44.asServiceRole.entities.AdminMagicLinkToken.create({
      email,
      token_hash: tokenHash,
      nonce,
      expires_at: expiresAt,
      used: false,
      revoked: false,
      requested_ip: ip,
      requested_user_agent: userAgent
    });

    // Build callback URL
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://localrank.ai';
    const callbackUrl = `${appBaseUrl}/admin-auth/callback?token=${rawToken}`;

    // Send email
    try {
      await sendMagicLinkEmail(email, callbackUrl);
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email,
        event_type: 'magic_link_sent',
        ip,
        user_agent: userAgent
      });
    } catch (sendError) {
      console.error('Email send failed:', sendError);
      await base44.asServiceRole.entities.AdminAuthAuditLog.create({
        email,
        event_type: 'magic_link_send_failed',
        ip,
        user_agent: userAgent,
        metadata: { error: sendError.message }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'If that email is authorized, a secure sign-in link has been sent.'
    }), { status: 200 });
  } catch (error) {
    console.error('Request magic link error:', error);
    return new Response(JSON.stringify({
      success: true,
      message: 'If that email is authorized, a secure sign-in link has been sent.'
    }), { status: 200 });
  }
});