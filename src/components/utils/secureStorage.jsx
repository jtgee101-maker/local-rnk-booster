/**
 * Secure Storage Utility
 * 
 * Prevents storing sensitive lead data in sessionStorage by:
 * 1. Only storing lead IDs (not full lead objects)
 * 2. Storing non-sensitive quiz progress data
 * 3. Providing utilities to fetch lead data when needed
 * 
 * Security: Sensitive data (emails, phone, business details) only live in
 * component state or database - NEVER in browser storage
 */

import { base44 } from '@/api/base44Client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('secureStorage');

// ==========================================
// LEAD DATA MANAGEMENT (Secure)
// ==========================================

/**
 * Save only the lead ID after quiz submission
 * @param {string} leadId - The lead's database ID
 * @param {string} version - Quiz version (v2, v3, etc)
 */
export function saveLeadReference(leadId, version = 'v3') {
  if (!leadId) {
    console.warn('No lead ID provided to saveLeadReference');
    return;
  }
  
  sessionStorage.setItem('lead_id', leadId);
  sessionStorage.setItem('quiz_version', version);
  
  logger.debug(`Saved lead reference: ${leadId} (${version})`);
}

/**
 * Get the stored lead ID
 * @returns {string|null} Lead ID or null
 */
export function getLeadId() {
  return sessionStorage.getItem('lead_id');
}

/**
 * Get the quiz version
 * @returns {string|null} Version or null
 */
export function getQuizVersion() {
  return sessionStorage.getItem('quiz_version');
}

/**
 * Fetch full lead data from database using stored ID
 * Use this when you actually need the lead data
 * @returns {Promise<Object|null>} Lead data or null
 */
export async function fetchLeadData() {
  const leadId = getLeadId();
  
  if (!leadId) {
    console.warn('No lead ID found in storage');
    return null;
  }
  
  try {
    const leads = await base44.entities.Lead.filter({ id: leadId });
    return leads && leads.length > 0 ? leads[0] : null;
  } catch (error) {
    console.error('Error fetching lead data:', error);
    return null;
  }
}

/**
 * Clear lead reference from storage
 */
export function clearLeadReference() {
  sessionStorage.removeItem('lead_id');
  sessionStorage.removeItem('quiz_version');
  // Legacy cleanup
  sessionStorage.removeItem('quizLead');
  sessionStorage.removeItem('quizVersion');
}

// ==========================================
// DISPLAY-ONLY DATA (Non-sensitive)
// ==========================================

/**
 * Store display-only data for results page
 * (health score, business name - not email/phone)
 * @param {Object} displayData - { healthScore, businessName, criticalIssues }
 */
export function saveDisplayData(displayData) {
  const sanitized = {
    healthScore: displayData.healthScore || 0,
    businessName: displayData.businessName || '',
    criticalIssues: displayData.criticalIssues || [],
    thumbtackTax: displayData.thumbtackTax // V2 only
  };
  
  sessionStorage.setItem('quiz_display_data', JSON.stringify(sanitized));
}

/**
 * Get display data for results page
 * @returns {Object|null} Display data or null
 */
export function getDisplayData() {
  const data = sessionStorage.getItem('quiz_display_data');
  return data ? JSON.parse(data) : null;
}

/**
 * Clear display data
 */
export function clearDisplayData() {
  sessionStorage.removeItem('quiz_display_data');
}

// ==========================================
// QUIZ PROGRESS (Safe to cache)
// ==========================================

/**
 * Save quiz progress for resume functionality
 * Only stores non-sensitive quiz answers
 * @param {string} version - Quiz version
 * @param {Object} progress - { step, stepNumber, answers }
 */
export function saveQuizProgress(version, progress) {
  const key = `quiz_progress_${version}`;
  sessionStorage.setItem(key, JSON.stringify(progress));
}

/**
 * Get quiz progress
 * @param {string} version - Quiz version
 * @returns {Object|null} Progress data or null
 */
export function getQuizProgress(version) {
  const key = `quiz_progress_${version}`;
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Clear quiz progress
 * @param {string} version - Quiz version
 */
export function clearQuizProgress(version) {
  const key = `quiz_progress_${version}`;
  sessionStorage.removeItem(key);
}

// ==========================================
// SESSION CLEANUP
// ==========================================

/**
 * Clear all quiz-related session storage
 * Use on logout or session expiry
 */
export function clearAllQuizData() {
  clearLeadReference();
  clearDisplayData();
  clearQuizProgress('v2');
  clearQuizProgress('v3');
  
  // Legacy cleanup
  sessionStorage.removeItem('quizLead');
  sessionStorage.removeItem('quizVersion');
  sessionStorage.removeItem('quiz_step');
  sessionStorage.removeItem('quiz_step_number');
  sessionStorage.removeItem('quiz_data');
  sessionStorage.removeItem('quizv3_step');
  sessionStorage.removeItem('quizv3_step_number');
  sessionStorage.removeItem('quizv3_data');
  
  logger.debug('Cleared all quiz session data');
}