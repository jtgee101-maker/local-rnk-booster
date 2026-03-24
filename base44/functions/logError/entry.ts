import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { error_type, severity, message, stack_trace, metadata } = await req.json();

    await base44.asServiceRole.entities.ErrorLog.create({
      error_type,
      severity: severity || 'medium',
      message,
      stack_trace,
      metadata
    });

    // If critical, notify admin immediately
    if (severity === 'critical') {
      try {
        const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'admin_email' });
        const adminEmail = settings[0]?.setting_value || 'admin@localrank.ai';

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          from_name: 'LocalRank.ai Error Monitor',
          subject: `🚨 CRITICAL ERROR: ${error_type}`,
          body: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #ef4444;">Critical Error Detected</h2>
              <p><strong>Type:</strong> ${error_type}</p>
              <p><strong>Message:</strong> ${message}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              ${metadata ? `<p><strong>Context:</strong> ${JSON.stringify(metadata, null, 2)}</p>` : ''}
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send critical error email:', emailError);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});