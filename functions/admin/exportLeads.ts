import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 10000);

    // Convert to CSV
    const headers = ['ID', 'Business Name', 'Email', 'Phone', 'Category', 'Pain Point', 'Timeline', 'Health Score', 'Rating', 'Reviews', 'Created Date'];
    const rows = leads.map(lead => [
      lead.id,
      lead.business_name || '',
      lead.email,
      lead.phone || '',
      lead.business_category || '',
      lead.pain_point || '',
      lead.timeline || '',
      lead.health_score || '',
      lead.gmb_rating || '',
      lead.gmb_reviews_count || '',
      new Date(lead.created_date).toISOString()
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=leads-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}));