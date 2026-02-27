import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const payload = await req.json();
    const { type, startDate, endDate } = payload;

    // Validate date range (max 90 days to prevent massive fetches)
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    if ((end.getTime() - start.getTime()) > 90 * 24 * 60 * 60 * 1000) {
      return Response.json({ error: 'Date range cannot exceed 90 days' }, { status: 400 });
    }

    // Get email logs with limit (max 5000 for performance)
    const allLogs = await base44.asServiceRole.entities.EmailLog.list();

    // Filter by date range
    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.created_date);
      return logDate >= start && logDate <= end;
    });

    // Filter by type if specified
    const typedLogs = type && type !== 'all' 
      ? filteredLogs.filter(log => log.type === type)
      : filteredLogs;

    // Calculate metrics
    const totalSent = typedLogs.length;
    const totalFailed = typedLogs.filter(l => l.status === 'failed').length;
    const totalBounced = typedLogs.filter(l => l.status === 'bounced' || l.bounce_type).length;
    const totalOpened = typedLogs.filter(l => l.status === 'opened' || (l.open_count as number) > 0).length;
    const totalClicked = typedLogs.filter(l => l.status === 'clicked' || (l.click_count as number) > 0).length;
    const totalUnsubscribed = typedLogs.filter(l => l.is_unsubscribed).length;

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0';
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(2) : '0';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0';
    const unsubscribeRate = totalSent > 0 ? ((totalUnsubscribed / totalSent) * 100).toFixed(2) : '0';
    const deliveryRate = totalSent > 0 ? (((totalSent - totalFailed) / totalSent) * 100).toFixed(2) : '0';

    // Group by date for daily summary
    const dailySummary: Record<string, { sent: number; opened: number; clicked: number; failed: number; bounced: number }> = {};
    typedLogs.forEach(log => {
      const date = new Date(log.created_date).toISOString().split('T')[0];
      if (!dailySummary[date]) {
        dailySummary[date] = { sent: 0, opened: 0, clicked: 0, failed: 0, bounced: 0 };
      }
      dailySummary[date].sent++;
      if (log.status === 'opened' || (log.open_count as number) > 0) dailySummary[date].opened++;
      if (log.status === 'clicked' || (log.click_count as number) > 0) dailySummary[date].clicked++;
      if (log.status === 'failed') dailySummary[date].failed++;
      if (log.status === 'bounced' || log.bounce_type) dailySummary[date].bounced++;
    });

    // Group by type for type summary
    const typeSummary: Record<string, { sent: number; opened: number; clicked: number; failed: number; openRate?: string | number; clickRate?: string | number; failureRate?: string | number }> = {};
    allLogs.forEach(log => {
      if (!typeSummary[log.type as string]) {
        typeSummary[log.type as string] = { sent: 0, opened: 0, clicked: 0, failed: 0 };
      }
      typeSummary[log.type as string].sent++;
      if (log.status === 'opened' || (log.open_count as number) > 0) typeSummary[log.type as string].opened++;
      if (log.status === 'clicked' || (log.click_count as number) > 0) typeSummary[log.type as string].clicked++;
      if (log.status === 'failed') typeSummary[log.type as string].failed++;
    });

    // Calculate rates for each type
    Object.keys(typeSummary).forEach(t => {
      const data = typeSummary[t];
      data.openRate = data.sent > 0 ? ((data.opened / data.sent) * 100).toFixed(2) : '0';
      data.clickRate = data.opened > 0 ? ((data.clicked / data.opened) * 100).toFixed(2) : '0';
      data.failureRate = data.sent > 0 ? ((data.failed / data.sent) * 100).toFixed(2) : '0';
    });

    return Response.json({
      success: true,
      metrics: {
        totalSent,
        totalOpened,
        totalClicked,
        totalFailed,
        totalBounced,
        totalUnsubscribed,
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
        bounceRate: parseFloat(bounceRate),
        unsubscribeRate: parseFloat(unsubscribeRate),
        deliveryRate: parseFloat(deliveryRate)
      },
      dailySummary,
      typeSummary,
      recentEmails: typedLogs.slice(0, 50)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));