import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin-only: reset a failed job back to pending so it gets picked up again.
 * Payload: { job_id }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { job_id } = await req.json();
    if (!job_id) {
      return Response.json({ error: 'job_id is required' }, { status: 400 });
    }

    const job = await base44.asServiceRole.entities.JobQueue.get(job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.JobQueue.update(job_id, {
      status: 'pending',
      attempts: 0,
      error_message: null,
      last_attempt_at: null,
    });

    return Response.json({ success: true, message: `Job ${job_id} reset to pending` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});