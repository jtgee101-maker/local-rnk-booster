import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { healthCheckData, isTest } = await req.json();

    // Get admin user email
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      return Response.json({ error: 'No admin users found' }, { status: 404 });
    }

    const adminEmail = adminUsers[0].email;

    // Build alert email content
    const failures = healthCheckData.checks?.filter(c => c.status === 'fail') || [];
    const warnings = healthCheckData.checks?.filter(c => c.status === 'warn') || [];

    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 ${isTest ? 'TEST ALERT' : 'Health Check Alert'}</h1>
        </div>
        
        <div style="padding: 30px; background: #f7fafc;">
          <div style="background: ${healthCheckData.overall_status === 'critical' ? '#fed7d7' : '#feebc8'}; 
                      border-left: 4px solid ${healthCheckData.overall_status === 'critical' ? '#f56565' : '#ed8936'}; 
                      padding: 15px; margin-bottom: 20px;">
            <strong style="color: ${healthCheckData.overall_status === 'critical' ? '#c53030' : '#c05621'};">
              System Status: ${healthCheckData.overall_status.toUpperCase()}
            </strong>
          </div>

          <h2 style="color: #2d3748; margin-top: 0;">Summary</h2>
          <ul style="color: #4a5568; line-height: 1.8;">
            <li>✅ Passed: ${healthCheckData.passed || 0}</li>
            <li>⚠️ Warnings: ${healthCheckData.warnings || 0}</li>
            <li>❌ Failures: ${healthCheckData.failures || 0}</li>
          </ul>
    `;

    if (failures.length > 0) {
      emailBody += `
        <h3 style="color: #c53030; border-top: 2px solid #e2e8f0; padding-top: 20px;">Critical Failures</h3>
        <ul style="color: #4a5568;">
      `;
      failures.forEach(check => {
        emailBody += `<li><strong>${check.name}:</strong> ${check.message}</li>`;
      });
      emailBody += `</ul>`;
    }

    if (warnings.length > 0) {
      emailBody += `
        <h3 style="color: #c05621; border-top: 2px solid #e2e8f0; padding-top: 20px;">Warnings</h3>
        <ul style="color: #4a5568;">
      `;
      warnings.forEach(check => {
        emailBody += `<li><strong>${check.name}:</strong> ${check.message}</li>`;
      });
      emailBody += `</ul>`;
    }

    emailBody += `
          <div style="margin-top: 30px; padding: 15px; background: #edf2f7; border-radius: 8px;">
            <p style="color: #718096; margin: 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString()}<br>
              Execution Time: ${healthCheckData.execution_time_ms}ms
            </p>
          </div>
        </div>
        
        <div style="background: #2d3748; padding: 20px; text-align: center;">
          <p style="color: #a0aec0; margin: 0; font-size: 12px;">
            LocalRank.ai System Health Monitor
          </p>
        </div>
      </div>
    `;

    // Send email
    await base44.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `${isTest ? '[TEST] ' : ''}🚨 Health Check ${healthCheckData.overall_status === 'critical' ? 'CRITICAL' : 'WARNING'}`,
      body: emailBody,
      from_name: 'LocalRank System Monitor'
    });

    return Response.json({ 
      success: true, 
      message: `Alert email sent to ${adminEmail}`,
      isTest 
    });
  } catch (error) {
    console.error('Error sending health alert:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}));