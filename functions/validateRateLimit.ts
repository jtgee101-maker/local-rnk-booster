import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { withDenoErrorHandler, FunctionError } from './utils/errorHandler';

/**
 * Server-side rate limiting validation
 * Prevents bypassing client-side rate limits
 */
Deno.serve(withDenoErrorHandler(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ 
        allowed: false, 
        error: 'Email required' 
      }, { status: 400 });
    }

    // Check recent submissions from this email (last 60 minutes)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentLeads = await base44.asServiceRole.entities.Lead.filter({
      email: email,
      created_date: { $gte: oneHourAgo }
    }, '-created_date', 10);

    const MAX_SUBMISSIONS_PER_HOUR = 3;
    
    if (recentLeads.length >= MAX_SUBMISSIONS_PER_HOUR) {
      return Response.json({
        allowed: false,
        error: 'Too many submissions. Please wait before submitting again.',
        submissionsCount: recentLeads.length,
        waitMinutes: 60
      }, { status: 429 });
    }

    return Response.json({
      allowed: true,
      submissionsCount: recentLeads.length,
      remainingSubmissions: MAX_SUBMISSIONS_PER_HOUR - recentLeads.length
    });
  } catch (error) {
    console.error('Rate limit validation error:', error);
    return Response.json({ 
      allowed: true, // Fail open to not block legitimate users
      error: 'Validation error'
    }, { status: 500 });
  }
}));