import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize Client Onboarding
 * Creates onboarding checklist and triggers automated workflow
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead
    const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id }).then(r => r[0]);
    
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Default onboarding steps
    const onboardingSteps = [
      {
        step_name: 'Welcome Email Received',
        description: 'Check your inbox for the welcome email with initial instructions',
        status: 'completed',
        completed_date: new Date().toISOString(),
        order: 1
      },
      {
        step_name: 'Account Portal Access',
        description: 'Log into your client dashboard and explore the interface',
        status: 'pending',
        order: 2
      },
      {
        step_name: 'Schedule Kickoff Call',
        description: 'Book your 1-on-1 kickoff call with your account manager',
        status: 'pending',
        order: 3
      },
      {
        step_name: 'Complete Business Profile',
        description: 'Fill out detailed business information and optimization preferences',
        status: 'pending',
        order: 4
      },
      {
        step_name: 'Review Action Plan',
        description: 'Review and approve your personalized 90-day optimization roadmap',
        status: 'pending',
        order: 5
      },
      {
        step_name: 'Grant GMB Access',
        description: 'Provide access to your Google My Business profile',
        status: 'pending',
        order: 6
      },
      {
        step_name: 'Access Training Resources',
        description: 'Watch onboarding videos and review best practices guide',
        status: 'pending',
        order: 7
      },
      {
        step_name: 'Join Slack Channel',
        description: 'Connect with your dedicated team via Slack for real-time support',
        status: 'pending',
        order: 8
      }
    ];

    // Create onboarding record
    const onboarding = await base44.asServiceRole.entities.ClientOnboarding.create({
      lead_id,
      business_name: lead.business_name,
      email: lead.email,
      status: 'in_progress',
      steps: onboardingSteps,
      kickoff_call_scheduled: false,
      training_resources_accessed: [],
      completion_percentage: 12.5 // 1 out of 8 steps completed
    });

    // Update lead
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      admin_notes: (lead.admin_notes || '') + `\n[${new Date().toISOString()}] Onboarding workflow initiated (ID: ${onboarding.id})`
    });

    return Response.json({ 
      success: true, 
      onboarding_id: onboarding.id,
      next_step: 'Account Portal Access',
      completion_percentage: 12.5
    });

  } catch (error) {
    console.error('Error initializing onboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});