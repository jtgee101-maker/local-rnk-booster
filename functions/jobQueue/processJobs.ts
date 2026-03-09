import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Job Queue Processor — runs every 5 minutes via scheduled automation.
 * Picks up pending jobs, routes by type, retries on failure.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const jobs = await base44.asServiceRole.entities.JobQueue.filter(
      { status: 'pending' },
      'priority',
      20
    );

    if (jobs.length === 0) {
      return Response.json({ success: true, processed: 0, message: 'No pending jobs' });
    }

    let processed = 0, failed = 0;
    const errors = [];

    for (const job of jobs) {
      const attempts = (job.attempts || 0);
      const maxAttempts = job.max_attempts || 3;

      // Skip exhausted jobs
      if (attempts >= maxAttempts) {
        await base44.asServiceRole.entities.JobQueue.update(job.id, {
          status: 'failed',
          error_message: 'Max attempts exceeded'
        });
        failed++;
        continue;
      }

      // Mark as processing
      await base44.asServiceRole.entities.JobQueue.update(job.id, {
        status: 'processing',
        attempts: attempts + 1,
        last_attempt_at: new Date().toISOString()
      });

      try {
        const jobName = job.payload?.job_name;

        if (job.job_type === 'other' && jobName === 'enrich_lead_retry') {
          await base44.asServiceRole.functions.invoke('enrichLead', {
            lead_id: job.payload.lead_id,
            email: job.payload.email
          });

        } else if (job.job_type === 'calculate_score') {
          await base44.asServiceRole.functions.invoke('updateEngagementScore', {
            lead_id: job.payload.lead_id
          });

        } else if (job.job_type === 'send_email') {
          await base44.asServiceRole.functions.invoke('nurture/processScheduledEmails', {});

        } else if (job.job_type === 'generate_content') {
          // Placeholder for future content generation jobs
          console.log(`Skipping generate_content job ${job.id} — handler not yet implemented`);

        } else {
          throw new Error(`Unsupported job type: ${job.job_type}/${jobName}`);
        }

        await base44.asServiceRole.entities.JobQueue.update(job.id, {
          status: 'completed',
          completed_at: new Date().toISOString()
        });
        processed++;

      } catch (err) {
        const newAttempts = attempts + 1;
        const isFinal = newAttempts >= maxAttempts;

        await base44.asServiceRole.entities.JobQueue.update(job.id, {
          status: isFinal ? 'failed' : 'pending',
          error_message: err.message,
          last_attempt_at: new Date().toISOString()
        });

        failed++;
        errors.push({ job_id: job.id, type: job.job_type, error: err.message });
        console.error(`Job ${job.id} (${job.job_type}) failed: ${err.message}`);
      }
    }

    console.log(`processJobs complete — processed:${processed} failed:${failed} total:${jobs.length}`);
    return Response.json({ success: true, processed, failed, total: jobs.length, errors });

  } catch (error) {
    console.error('processJobs fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});