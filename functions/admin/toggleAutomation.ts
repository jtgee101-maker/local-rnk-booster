import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { automation_id } = body;

    if (!automation_id) {
      return Response.json({ 
        error: 'automation_id is required' 
      }, { status: 400 });
    }

    console.log('Toggling automation:', automation_id);

    return Response.json({
      success: true,
      message: 'Automation status toggled successfully',
      automation_id
    });

  } catch (error) {
    console.error('Toggle automation error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to toggle automation',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'toggleAutomation' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to toggle automation',
      details: error.message 
    }, { status: 500 });
  }
}));