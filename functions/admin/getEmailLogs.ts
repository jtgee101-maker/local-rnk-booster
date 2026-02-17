import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { limit = 100, type, status } = await req.json();

    let logs;
    if (type || status) {
      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      logs = await base44.asServiceRole.entities.EmailLog.filter(filter, '-created_date', limit);
    } else {
      logs = await base44.asServiceRole.entities.EmailLog.list('-created_date', limit);
    }

    // Calculate stats
    const total = logs.length;
    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const bounced = logs.filter(l => l.status === 'bounced').length;
    const opened = logs.filter(l => l.status === 'opened').length;

    return Response.json({
      logs,
      stats: {
        total,
        sent,
        failed,
        bounced,
        opened,
        deliveryRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));