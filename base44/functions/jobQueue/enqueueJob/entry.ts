import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Enqueue a background job.
 * Callable from other functions or admin UI.
 * Payload: { job_type, payload, priority? }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { job_type, payload, priority = 5, max_attempts = 3 } = body;

    if (!job_type || !payload) {
      return Response.json({ error: 'job_type and payload are required' }, { status: 400 });
    }

    const job = await base44.asServiceRole.entities.JobQueue.create({
      job_type,
      payload,
      status: 'pending',
      attempts: 0,
      max_attempts,
      priority,
    });

    return Response.json({ success: true, job_id: job.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});