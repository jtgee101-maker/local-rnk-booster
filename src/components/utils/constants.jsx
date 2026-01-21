// Quiz Health Score Constants
export const HEALTH_SCORE = {
  BASE: 25,
  MIN: 15,
  MAX: 72,
  
  RATING: {
    EXCELLENT: { threshold: 4.8, points: 12 },
    GOOD: { threshold: 4.5, points: 8 },
    FAIR: { threshold: 4.0, points: 4 },
    POOR_PENALTY: -5
  },
  
  REVIEWS: {
    EXCELLENT: { threshold: 100, points: 15 },
    GOOD: { threshold: 50, points: 10 },
    FAIR: { threshold: 25, points: 5 },
    POOR: { threshold: 10, penalty: -5 }
  },
  
  PHOTOS: {
    EXCELLENT: { threshold: 50, points: 10 },
    GOOD: { threshold: 30, points: 6 },
    FAIR: { threshold: 15, points: 3 },
    POOR_PENALTY: -3
  },
  
  HAS_HOURS_POINTS: 4,
  NO_HOURS_PENALTY: -6,
  HAS_WEBSITE_POINTS: 5,
  NO_WEBSITE_PENALTY: -5,
  NO_PHONE_PENALTY: -8,
  NO_TYPES_PENALTY: -5
};

// Revenue Loss Per Health Point
export const REVENUE_LOSS_PER_POINT = 150;

// Lead Cost Constants
export const LEAD_COSTS = {
  STANDARD: 100,
  SCORPION: 2000,
  WEEKS_PER_MONTH: 4,
  MONTHS_PER_YEAR: 12
};

// Rate Limiting
export const RATE_LIMITS = {
  QUIZ_SUBMISSION_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  MAX_SUBMISSIONS_PER_WINDOW: 3,
  LEAD_DUPLICATE_CHECK_WINDOW_HOURS: 24
};

// Email Retry Configuration
export const EMAIL_RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2
};

// Mobile Touch Target Minimum Size
export const MOBILE = {
  MIN_TAP_TARGET_SIZE: 44, // iOS recommended minimum
  VIEWPORT_MAX_SCALE: 5.0
};

// Session Cache Expiry
export const SESSION_CACHE_EXPIRY_MS = 3 * 60 * 60 * 1000; // 3 hours