import { Resend } from 'npm:resend@3.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    console.log('=== SETTING UP RESEND WEBHOOKS ===');

    const webhookUrl = 'https://localrnk.com/resendWebhookHandler';
    const events = ['email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked'];

    // List existing webhooks
    console.log('\n--- Checking existing webhooks ---');
    let listResult;
    try {
      listResult = await resend.webhooks.list();
      console.log('Existing webhooks:', JSON.stringify(listResult, null, 2));
    } catch (listError) {
      console.error('List error:', listError.message);
    }

    // Create new webhook
    console.log('\n--- Creating webhook ---');
    const createResult = await resend.webhooks.create({
      endpoint: webhookUrl,
      events: events
    });

    console.log('Create result:', JSON.stringify(createResult, null, 2));

    if (createResult.error) {
      console.error('ERROR creating webhook:', createResult.error);
      return Response.json({
        success: false,
        error: createResult.error
      }, { status: 500 });
    }

    const webhookId = createResult.data?.id;
    console.log('✅ Webhook created:', webhookId);

    // Test webhook exists
    if (webhookId) {
      console.log('\n--- Retrieving webhook ---');
      const getResult = await resend.webhooks.get(webhookId);
      console.log('Get result:', JSON.stringify(getResult, null, 2));
    }

    return Response.json({
      success: true,
      webhookId: webhookId,
      endpoint: webhookUrl,
      events: events,
      message: 'Webhook created successfully'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});