import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

/**
 * ADMIN ONLY: Clean up leads with invalid data
 * Deletes leads without email or with invalid email format
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN AUTH CHECK
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all leads
    const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 1000);
    
    // Find invalid leads
    const invalidLeads = allLeads.filter(lead => 
      !lead.email || 
      !lead.email.includes('@') || 
      lead.email.trim().length === 0
    );

    // Delete invalid leads
    const deletePromises = invalidLeads.map(lead => 
      base44.asServiceRole.entities.Lead.delete(lead.id)
    );

    await Promise.all(deletePromises);

    return Response.json({
      success: true,
      total_leads: allLeads.length,
      invalid_found: invalidLeads.length,
      deleted: invalidLeads.length,
      remaining: allLeads.length - invalidLeads.length
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});