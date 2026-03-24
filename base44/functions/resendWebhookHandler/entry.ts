import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const STATUS_MAP = {
  'email.sent': 'sent',
  'email.delivered': 'sent',
  'email.delivery_delayed': 'sent',
  'email.bounced': 'bounced',
  'email.complained': 'bounced',
  'email.opened': 'opened',
  'email.clicked': 'opened'
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    const signature = req.headers.get('svix-signature');
    const timestamp = req.headers.get('svix-timestamp');
    const msgId = req.headers.get('svix-msg-id');

    if (!signature || !timestamp || !msgId || !webhookSecret) {
      console.warn('Missing webhook headers');
      return Response.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // Verify Svix HMAC signature
    const signedContent = `${msgId}.${timestamp}.${bodyText}`;
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(webhookSecret);
    const contentBytes = encoder.encode(signedContent);

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigPart = signature.split(',').map(s => s.trim()).find(s => s.startsWith('v1,'))?.replace('v1,', '') || signature.split(' ')[1] || '';
    const sigBytes = Uint8Array.from(atob(sigPart), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, contentBytes);

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const eventType = payload.type;
    const resendEmailId = payload.data?.email_id;

    console.log(`Resend webhook: ${eventType} | id: ${resendEmailId}`);

    // Match EmailLog by resend_id (primary) or message_id (legacy)
    let matchedLog = null;
    const byResendId = await base44.asServiceRole.entities.EmailLog.filter({ metadata: { resend_id: resendEmailId } }).catch(() => []);
    if (byResendId.length > 0) {
      matchedLog = byResendId[0];
    } else {
      const byMsgId = await base44.asServiceRole.entities.EmailLog.filter({ metadata: { message_id: resendEmailId } }).catch(() => []);
      if (byMsgId.length > 0) matchedLog = byMsgId[0];
    }

    if (matchedLog) {
      const update = {
        status: STATUS_MAP[eventType] || matchedLog.status,
        metadata: {
          ...matchedLog.metadata,
          last_webhook_event: eventType,
          last_webhook_at: new Date().toISOString()
        }
      };

      if (eventType === 'email.opened') {
        update.open_count = (matchedLog.open_count || 0) + 1;
        if (!matchedLog.first_opened_at) update.first_opened_at = new Date().toISOString();
      }
      if (eventType === 'email.clicked') {
        update.click_count = (matchedLog.click_count || 0) + 1;
        if (!matchedLog.first_clicked_at) update.first_clicked_at = new Date().toISOString();
      }
      if (eventType === 'email.bounced') {
        update.bounce_type = 'hard';
        update.bounced_at = new Date().toISOString();
      }

      await base44.asServiceRole.entities.EmailLog.update(matchedLog.id, update).catch(console.error);
      console.log(`Updated EmailLog ${matchedLog.id} for event ${eventType}`);
    } else {
      // No matching log — create a record for visibility
      await base44.asServiceRole.entities.EmailLog.create({
        to: payload.data?.to?.[0] || payload.data?.to || 'unknown',
        from: 'resend-webhook',
        subject: `[webhook] ${eventType}`,
        type: 'other',
        status: STATUS_MAP[eventType] || 'sent',
        metadata: { resend_id: resendEmailId, event_type: eventType, webhook_received_at: new Date().toISOString() }
      }).catch(console.error);
    }

    return Response.json({ success: true, received: eventType, resend_id: resendEmailId });

  } catch (error) {
    console.error('resendWebhookHandler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});