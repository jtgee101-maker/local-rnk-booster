import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from '../utils/errorHandler';

Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Get lead data
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Calculate personalized metrics
    const industryMultipliers = {
      'home_services': 1.2,
      'medical': 1.5,
      'professional': 1.3,
      'retail': 1.0,
      'other': 1.1
    };

    const multiplier = industryMultipliers[lead.business_category] || 1.1;
    const baseRevenueLeak = 2847;
    const personalizedRevenueLeak = Math.round(baseRevenueLeak * multiplier);
    const annualLeak = personalizedRevenueLeak * 12;

    // Create nurture sequence
    const sequence = {
      lead_id: leadId,
      email: lead.email,
      sequence_name: 'Foxy Audit Follow-up',
      total_steps: 5,
      current_step: 0,
      next_email_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await base44.asServiceRole.entities.LeadNurture.create(sequence);

    // Send immediate follow-up email
    await base44.asServiceRole.functions.invoke('sendFoxyNurtureEmail', {
      leadId,
      step: 1,
      auditData: {
        health_score: lead.health_score,
        revenue_leak: personalizedRevenueLeak,
        annual_leak: annualLeak,
        critical_issues: lead.critical_issues || [],
        business_category: lead.business_category,
        pain_point: lead.pain_point,
        business_name: lead.business_name
      }
    });

    return Response.json({ 
      success: true, 
      sequence_id: sequence.id,
      next_email: sequence.next_email_date 
    });

  } catch (error) {
    console.error('Nurture sequence error:', error);
    
    // Log error for debugging
    try {
      await base44.asServiceRole.entities.ErrorLog?.create?.({
        error_type: 'nurture_sequence_failure',
        severity: 'high',
        message: `Nurture sequence failed: ${error.message}`,
        stack_trace: error.stack,
        metadata: { lead_id: leadId }
      }).catch(() => {});
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});