import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    // Validate webhook signature
    const signature = req.headers.get('svix-signature');
    const timestamp = req.headers.get('svix-timestamp');
    const msgId = req.headers.get('svix-msg-id');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!signature || !timestamp || !msgId || !webhookSecret) {
      console.warn('Missing webhook headers');
      return Response.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // Verify signature: svix-id.timestamp.signature
    const signedContent = `${msgId}.${timestamp}.${bodyText}`;
    const encoder = new TextEncoder();
    const signatureBytes = encoder.encode(signature.split(' ')[1]);
    const contentBytes = encoder.encode(signedContent);
    const keyBytes = encoder.encode(webhookSecret);

    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, contentBytes);

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('=== RESEND WEBHOOK EVENT ===');
    console.log('Event Type:', payload.type);
    console.log('Full Payload:', JSON.stringify(payload, null, 2));

    // Log webhook event
    await base44.asServiceRole.entities.EmailLog.filter({ 
      metadata: { message_id: payload.data?.email_id } 
    }).then(async logs => {
      if (logs.length > 0) {
        // Update existing log with webhook data
        await base44.asServiceRole.entities.EmailLog.update(logs[0].id, {
          status: mapEventToStatus(payload.type),
          metadata: {
            ...logs[0].metadata,
            webhook_event: payload.type,
            webhook_received_at: new Date().toISOString(),
            resend_event_timestamp: payload.created_at
          }
        }).catch(err => console.error('Failed to update log:', err));
      } else {
        // Create new log for webhook event
        await base44.asServiceRole.entities.EmailLog.create({
          to: payload.data?.to || 'unknown',
          from: 'Resend Webhook',
          subject: `Webhook: ${payload.type}`,
          type: 'webhook_event',
          status: mapEventToStatus(payload.type),
          metadata: {
            message_id: payload.data?.email_id,
            event_type: payload.type,
            webhook_received_at: new Date().toISOString(),
            full_event: payload
          }
        }).catch(err => console.error('Failed to create log:', err));
      }
    }).catch(err => console.error('Filter error:', err));

    console.log('✅ Webhook event logged');

    return Response.json({ 
      success: true,
      received: payload.type,
      messageId: payload.data?.email_id
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}));

function mapEventToStatus(eventType) {
  const mapping = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'delayed',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.opened': 'opened',
    'email.clicked': 'clicked'
  };
  return mapping[eventType] || 'webhook_received';
}