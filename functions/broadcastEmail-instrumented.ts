import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler.js';
import { sendEmailWithRetry } from './utils/emailRetry.js';
import { logFunctionError } from './utils/addErrorLogging.js';

/**
 * Broadcast Email to All Confirmed Leads or Orders
 * OPTIMIZED WITH ERROR LOGGING
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { subject, body, recipient_type = 'leads', test_mode = false } = await req.json();

    if (!subject || !body) {
      return Response.json({ error: 'Subject and body required' }, { status: 400 });
    }

    // Get recipients with pagination (optimized)
    const recipients = await fetchRecipientsPaginated(base44, recipient_type);
    
    if (test_mode) {
      return Response.json({
        success: true,
        mode: 'test',
        recipient_count: recipients.length,
        sample_recipients: recipients.slice(0, 5).map(r => r.email)
      });
    }

    // Send in batches with error tracking
    const results = await sendBroadcastBatch(base44, recipients, subject, body, user.id);

    // Log results
    console.log(`Broadcast complete: ${results.sent} sent, ${results.failed} failed`);

    return Response.json({
      success: true,
      total_recipients: recipients.length,
      sent: results.sent,
      failed: results.failed,
      batch_id: results.batch_id
    });

  } catch (error) {
    // INSTRUMENTED: Log to ErrorLog
    await logFunctionError(error as Error, req, {
      functionName: 'broadcastEmail',
      userId: (await createClientFromRequest(req).auth.me())?.id
    });
    
    console.error('Broadcast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));

async function fetchRecipientsPaginated(base44, type) {
  const all = [];
  let cursor = null;
  const pageSize = 500;
  
  for (let i = 0; i < 10; i++) { // Max 5000 recipients
    const query = type === 'leads' 
      ? { email: { $exists: true }, unsubscribed: { $ne: true } }
      : { email: { $exists: true }, status: 'confirmed' };
      
    if (cursor) query._id = { $gt: cursor };
    
    const page = await base44.asServiceRole.entities[type === 'leads' ? 'Lead' : 'Order'].filter(
      query, '_id', pageSize
    );
    
    if (page.length === 0) break;
    all.push(...page);
    cursor = page[page.length - 1].id;
  }
  
  return all;
}

async function sendBroadcastBatch(base44, recipients, subject, body, adminId) {
  const batchId = crypto.randomUUID();
  let sent = 0;
  let failed = 0;
  
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    
    await Promise.allSettled(
      batch.map(async (recipient) => {
        try {
          await sendEmailWithRetry({
            to: recipient.email,
            subject,
            body,
            from_name: 'LocalRank.ai'
          });
          
          await base44.asServiceRole.entities.EmailLog.create({
            to: recipient.email,
            subject,
            type: 'broadcast',
            status: 'sent',
            batch_id: batchId,
            metadata: { admin_id: adminId }
          });
          
          sent++;
        } catch (error) {
          failed++;
          console.error(`Failed to send to ${recipient.email}:`, error);
          
          // Log individual failures for tracking
          await base44.asServiceRole.entities.ErrorLog.create({
            error_type: 'EmailSendFailure',
            message: `Failed to send broadcast to ${recipient.email}`,
            metadata: {
              recipient_email: recipient.email,
              batch_id: batchId,
              error: error.message
            }
          });
        }
      })
    );
    
    // Rate limiting
    if (i + 10 < recipients.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return { sent, failed, batch_id: batchId };
}
