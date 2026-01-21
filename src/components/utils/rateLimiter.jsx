import { RATE_LIMITS } from './constants';

/**
 * Client-side rate limiting for quiz submissions
 * Prevents spam and reduces DB load
 */
export class QuizRateLimiter {
  constructor() {
    this.storageKey = 'quiz_submission_timestamps';
  }

  /**
   * Check if user can submit quiz
   * @returns {boolean} true if allowed, false if rate limited
   */
  canSubmit() {
    const timestamps = this.getTimestamps();
    const now = Date.now();
    const windowStart = now - RATE_LIMITS.QUIZ_SUBMISSION_WINDOW_MS;
    
    // Filter to only recent submissions within window
    const recentSubmissions = timestamps.filter(ts => ts > windowStart);
    
    // Save cleaned up list
    this.saveTimestamps(recentSubmissions);
    
    return recentSubmissions.length < RATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW;
  }

  /**
   * Record a quiz submission
   */
  recordSubmission() {
    const timestamps = this.getTimestamps();
    timestamps.push(Date.now());
    this.saveTimestamps(timestamps);
  }

  /**
   * Get time until next submission allowed (in seconds)
   * @returns {number} seconds until allowed, or 0 if allowed now
   */
  getTimeUntilAllowed() {
    const timestamps = this.getTimestamps();
    if (timestamps.length < RATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW) {
      return 0;
    }
    
    const oldestInWindow = timestamps[0];
    const now = Date.now();
    const windowStart = now - RATE_LIMITS.QUIZ_SUBMISSION_WINDOW_MS;
    
    if (oldestInWindow > windowStart) {
      const timeUntilExpiry = oldestInWindow + RATE_LIMITS.QUIZ_SUBMISSION_WINDOW_MS - now;
      return Math.ceil(timeUntilExpiry / 1000);
    }
    
    return 0;
  }

  /**
   * Get timestamps from localStorage
   */
  getTimestamps() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Rate limiter storage error:', error);
      return [];
    }
  }

  /**
   * Save timestamps to localStorage
   */
  saveTimestamps(timestamps) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(timestamps));
    } catch (error) {
      console.error('Rate limiter storage error:', error);
    }
  }

  /**
   * Clear all rate limit data (for testing)
   */
  reset() {
    localStorage.removeItem(this.storageKey);
  }
}

export const quizRateLimiter = new QuizRateLimiter();