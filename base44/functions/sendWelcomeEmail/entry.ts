/**
 * DEPRECATED — Welcome emails are sent exclusively by geeniusWorkflowOrchestrator.
 * This stub prevents duplicate sends from old automation triggers or direct calls.
 */
Deno.serve(async (_req) => {
  console.warn('[DEPRECATED] sendWelcomeEmail called — this function is disabled. Use geeniusWorkflowOrchestrator.');
  return Response.json({
    success: false,
    deprecated: true,
    canonical: 'geeniusWorkflowOrchestrator',
    message: 'Disabled: welcome emails are sent by geeniusWorkflowOrchestrator only'
  }, { status: 410 });
});