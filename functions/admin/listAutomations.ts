import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Note: Base44 doesn't have built-in automation entity yet
    // This is a placeholder that returns mock data
    // In production, this would query the Automation entity
    
    const mockAutomations = [
      {
        id: 'auto_1',
        name: 'Daily Lead Nurture',
        automation_type: 'scheduled',
        function_name: 'processLeadNurture',
        description: 'Processes daily lead nurture sequences',
        is_active: true,
        status: 'active',
        schedule_type: 'simple',
        repeat_interval: 1,
        repeat_unit: 'days',
        start_time: '09:00',
        last_run: new Date(Date.now() - 3600000).toISOString(),
        next_run: new Date(Date.now() + 82800000).toISOString(),
        run_count: 45
      },
      {
        id: 'auto_2',
        name: 'Abandoned Cart Reminders',
        automation_type: 'scheduled',
        function_name: 'sendAbandonedCartReminders',
        description: 'Sends reminders for abandoned carts',
        is_active: true,
        status: 'active',
        schedule_type: 'simple',
        repeat_interval: 6,
        repeat_unit: 'hours',
        last_run: new Date(Date.now() - 21600000).toISOString(),
        next_run: new Date(Date.now() + 600000).toISOString(),
        run_count: 120
      },
      {
        id: 'auto_3',
        name: 'New Lead Notification',
        automation_type: 'entity',
        function_name: 'notifyAdminNewLead',
        description: 'Notifies admin when new lead is created',
        is_active: true,
        status: 'active',
        entity_name: 'Lead',
        event_types: ['create'],
        run_count: 234
      }
    ];

    return Response.json({
      success: true,
      automations: mockAutomations
    });

  } catch (error) {
    console.error('List automations error:', error);
    
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: 'system_error',
      severity: 'medium',
      message: 'Failed to list automations',
      stack_trace: error.stack || error.message,
      metadata: { endpoint: 'listAutomations' }
    }).catch(() => {});

    return Response.json({ 
      error: 'Failed to list automations',
      details: error.message 
    }, { status: 500 });
  }
});