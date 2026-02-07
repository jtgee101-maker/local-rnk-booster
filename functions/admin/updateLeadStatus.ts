import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { leadId, status, notes } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes) updateData.admin_notes = notes;

    const updatedLead = await base44.asServiceRole.entities.Lead.update(leadId, updateData);

    return Response.json({ success: true, lead: updatedLead });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});