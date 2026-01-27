import { Resend } from 'npm:resend@3.0.0';

/**
 * Production-grade Resend email service with full retry logic, error handling, and logging
 */

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const FROM_EMAIL = 'noreply@updates.localrank.com';

/**
 * Send email via Resend with automatic retry and error handling
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.from_name - Sender name
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {number} options.retryDelayMs - Delay between retries in ms (default: 1000)
 * @returns {Promise<{success: boolean, messageId: string, error?: string}>}
 */
export async function sendEmailViaResend(options) {
  const {
    to,
    from_name,
    subject,
    html,
    maxRetries = 3,
    retryDelayMs = 1000
  } = options;

  // Validate inputs
  if (!to || !subject || !html) {
    throw new Error('Missing required email fields: to, subject, html');
  }

  if (!Deno.env.get('RESEND_API_KEY')) {
    throw new Error('RESEND_API_KEY environment variable not set');
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send({
        from: `${from_name} <${FROM_EMAIL}>`,
        to,
        subject,
        html
      });

      if (result.error) {
        lastError = new Error(`Resend error: ${result.error.message}`);
        console.error(`Email attempt ${attempt} failed:`, result.error);

        // Don't retry on validation errors
        if (result.error.message?.includes('validation')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
          continue;
        }
        throw lastError;
      }

      // Success
      console.log(`Email sent successfully on attempt ${attempt}. Message ID: ${result.data?.id}`);
      return {
        success: true,
        messageId: result.data?.id,
        attempt
      };
    } catch (error) {
      lastError = error;
      console.error(`Email attempt ${attempt} error:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  // All retries exhausted
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Send admin notification email
 * @param {string} adminEmail - Admin email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export async function sendAdminEmail(adminEmail, subject, html) {
  if (!adminEmail) {
    throw new Error('Admin email is required');
  }

  return sendEmailViaResend({
    to: adminEmail,
    from_name: 'LocalRank.ai System',
    subject,
    html,
    maxRetries: 3
  });
}

/**
 * Send customer email
 * @param {string} customerEmail - Customer email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {string} fromName - From name (default: 'LocalRank.ai')
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export async function sendCustomerEmail(customerEmail, subject, html, fromName = 'LocalRank.ai') {
  if (!customerEmail) {
    throw new Error('Customer email is required');
  }

  return sendEmailViaResend({
    to: customerEmail,
    from_name: fromName,
    subject,
    html,
    maxRetries: 3
  });
}

/**
 * Batch send emails with concurrent limits
 * @param {Array<Object>} emails - Array of email objects
 * @param {number} concurrency - Max concurrent sends (default: 5)
 * @returns {Promise<{successful: number, failed: number, errors: Array}>}
 */
export async function sendBatchEmails(emails, concurrency = 5) {
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  const chunks = [];
  for (let i = 0; i < emails.length; i += concurrency) {
    chunks.push(emails.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(email =>
      sendEmailViaResend(email)
        .then(() => {
          results.successful++;
        })
        .catch(error => {
          results.failed++;
          results.errors.push({
            email: email.to,
            error: error.message
          });
        })
    );
    await Promise.all(promises);
  }

  return results;
}

/**
 * Format email with standard LocalRank template wrapper
 * Used internally for consistent email styling
 */
export function wrapEmailWithTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; }
        a { color: #c8ff00; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}