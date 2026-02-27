import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 10000) as Array<{ id: string; email?: string; base_offer?: { product?: string }; total_amount?: number; status?: string; stripe_session_id?: string; created_date: string }>;

    const headers = ['ID', 'Email', 'Product', 'Total Amount', 'Status', 'Stripe Session ID', 'Created Date'];
    const rows = orders.map(order => {
      const baseOffer = order.base_offer as { product?: string } | undefined;
      return [
        order.id,
        order.email,
        baseOffer?.product || '',
        order.total_amount || 0,
        order.status,
        order.stripe_session_id || '',
        new Date(order.created_date).toISOString()
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));