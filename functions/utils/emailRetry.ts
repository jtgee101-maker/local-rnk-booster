/**
 * Email Retry Utility
 * Provides exponential backoff retry logic for email sending
 * 
 * @param {Function} emailFn - The email sending function to retry
 * @param {Object} emailData - Email data to send
 * @param {number} maxAttempts - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} - { success: boolean, attempts: number }
 */
export async function sendEmailWithRetry(emailFn, emailData, maxAttempts = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await emailFn(emailData);
      
      if (attempt > 1) {
        console.log(`✅ Email sent successfully on attempt ${attempt}/${maxAttempts}`);
      }
      
      return { success: true, attempts: attempt };
    } catch (error) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt}/${maxAttempts} failed:`, error.message);
      
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // All attempts failed
  throw new Error(`Email failed after ${maxAttempts} attempts: ${lastError.message}`);
}