import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 10000);

    const headers = ['ID', 'Email', 'Product', 'Total Amount', 'Status', 'Stripe Session ID', 'Stripe Payment Intent', 'Refund ID', 'Refund Amount', 'Created Date'];
    const rows = orders.map(order => [
      order.id,
      order.email,
      order.base_offer?.product || '',
      order.total_amount || 0,
      order.status,
      order.stripe_session_id || '',
      order.stripe_payment_intent || '',
      order.refund_id || '',
      order.refund_amount || '',
      new Date(order.created_date).toISOString()
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

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
});