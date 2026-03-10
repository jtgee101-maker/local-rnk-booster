/**
 * DEPRECATED — Lead nurture scheduling is handled exclusively by geeniusWorkflowOrchestrator.
 * This stub prevents conflicting unconverted_followup sequences from being created.
 */
Deno.serve(async (_req) => {
  console.warn('[DEPRECATED] startLeadNurture called — this function is disabled. Use geeniusWorkflowOrchestrator.');
  return Response.json({
    success: false,
    deprecated: true,
    canonical: 'geeniusWorkflowOrchestrator',
    message: 'Disabled: lead nurture is scheduled by geeniusWorkflowOrchestrator only'
  }, { status: 410 });
});