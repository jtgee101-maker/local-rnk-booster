import { Resend } from 'npm:resend@3.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    console.log('=== RESEND API TEST ===');
    console.log('API Key exists:', !!Deno.env.get('RESEND_API_KEY'));
    console.log('API Key length:', Deno.env.get('RESEND_API_KEY')?.length);

    // Test 1: Simple send
    console.log('\n--- Test 1: Simple Email Send ---');
    const result = await resend.emails.send({
      from: 'noreply@updates.localrnk.com',
      to: 'jtgee101@gmail.com',
      subject: 'TEST: Resend Direct Test',
      html: '<p>If you see this, Resend is working!</p>'
    });

    console.log('Send result:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('ERROR:', result.error);
      return Response.json({ 
        success: false, 
        error: result.error,
        apiKeyValid: Deno.env.get('RESEND_API_KEY')?.startsWith('re_'),
        domainIssue: true
      }, { status: 500 });
    }

    if (!result.data?.id) {
      console.error('NO MESSAGE ID RETURNED!');
      return Response.json({
        success: false,
        error: 'No message ID returned',
        fullResponse: result
      }, { status: 500 });
    }

    console.log('✅ SUCCESS - Message ID:', result.data.id);

    // Test 2: List domains
    console.log('\n--- Test 2: List Domains ---');
    try {
      const domainsResult = await resend.domains.list();
      console.log('Domains:', JSON.stringify(domainsResult, null, 2));
    } catch (domainError) {
      console.error('Domain list error:', domainError.message);
    }

    return Response.json({
      success: true,
      messageId: result.data.id,
      email: 'jtgee101@gmail.com',
      domain: 'noreply@updates.localrnk.com',
      apiKeyValid: true
    });

  } catch (error) {
    console.error('TEST ERROR:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});