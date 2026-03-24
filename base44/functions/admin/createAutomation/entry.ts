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
    const {
      name,
      automation_type,
      function_name,
      description,
      is_active,
      schedule_type,
      repeat_interval,
      repeat_unit,
      start_time,
      entity_name,
      event_types
    } = body;

    // Validation
    if (!name || !automation_type || !function_name) {
      return Response.json({ 
        error: 'Missing required fields: name, automation_type, function_name' 
      }, { status: 400 });
    }

    if (automation_type === 'scheduled') {
      if (!repeat_interval || !repeat_unit) {
        return Response.json({ 
          error: 'Scheduled automations require repeat_interval and repeat_unit' 
        }, { status: 400 });
      }
      
      if (repeat_unit === 'minutes' && repeat_interval < 5) {
        return Response.json({ 
          error: 'Minimum interval is 5 minutes' 
        }, { status: 400 });
      }
    }

    if (automation_type === 'entity') {
      if (!entity_name || !event_types || event_types.length === 0) {
        return Response.json({ 
          error: 'Entity automations require entity_name and event_types' 
        }, { status: 400 });
      }
    }

    // Note: In production, this would use Base44's create_automation API
    // For now, we'll log the request and return success
    console.log('Creating automation:', {
      name,
      automation_type,
      function_name,
      description,
      is_active
    });

    const automationId = `auto_${Date.now()}`;

    return Response.json({
      success: true,
      message: 'Automation created successfully',
      automation_id: automationId,
      note: 'Backend automation creation will be fully functional once Base44 automation API is available'
    });

  } catch (error) {
    console.error('Create automation error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: 'Failed to create automation',
        stack_trace: error.stack || error.message,
        metadata: { endpoint: 'createAutomation' }
      });
    } catch {}

    return Response.json({ 
      error: 'Failed to create automation',
      details: error.message 
    }, { status: 500 });
  }
});