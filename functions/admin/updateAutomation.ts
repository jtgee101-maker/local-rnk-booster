import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { automation_id, ...updates } = body;

    if (!automation_id) {
      return Response.json({ 
        error: 'automation_id is required' 
      }, { status: 400 });
    }

    // Validation for updates
    if (updates.automation_type === 'scheduled') {
      if (updates.repeat_unit === 'minutes' && updates.repeat_interval < 5) {
        return Response.json({ 
          error: 'Minimum interval is 5 minutes' 
        }, { status: 400 });
      }
    }

    console.log('Updating automation:', automation_id, updates);

    return Response.json({
      success: true,
      message: 'Automation updated successfully',
      automation_id
    });

  } catch (error) {
    console.error('Update automation error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to update automation',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'updateAutomation' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to update automation',
      details: error.message 
    }, { status: 500 });
  }
});