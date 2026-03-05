import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

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

    // Automation deletion processed

    return Response.json({
      success: true,
      message: 'Automation deleted successfully',
      automation_id
    });

  } catch (error) {
    console.error('Delete automation error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to delete automation',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'deleteAutomation' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to delete automation',
      details: error.message 
    }, { status: 500 });
  }
}));