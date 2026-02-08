import { base44 } from '@/api/base44Client';

/**
 * Check if a lead already exists by email
 * Returns { isDuplicate: boolean, existingLead: object | null }
 */
export async function checkDuplicateLead(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingLeads = await base44.entities.Lead.filter({ 
      email: normalizedEmail 
    }, '-created_date', 1);
    
    if (existingLeads && existingLeads.length > 0) {
      return {
        isDuplicate: true,
        existingLead: existingLeads[0],
        daysSinceLastSubmission: getDaysSince(existingLeads[0].created_date)
      };
    }
    
    return {
      isDuplicate: false,
      existingLead: null,
      daysSinceLastSubmission: null
    };
  } catch (error) {
    console.error('Error checking duplicate lead:', error);
    // In case of error, allow submission (fail open)
    return {
      isDuplicate: false,
      existingLead: null,
      daysSinceLastSubmission: null,
      error: error.message
    };
  }
}

/**
 * Calculate days since a given date
 */
function getDaysSince(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Decide whether to create new lead or update existing
 * Returns { action: 'create' | 'update' | 'skip', reason: string }
 */
export function getLeadAction(duplicateCheck, options = {}) {
  const { 
    allowUpdateWithin = 30, // Allow updates within 30 days
    requireSignificantChange = true 
  } = options;
  
  if (!duplicateCheck.isDuplicate) {
    return { action: 'create', reason: 'New lead' };
  }
  
  const { existingLead, daysSinceLastSubmission } = duplicateCheck;
  
  // If recent submission (within allowUpdateWithin days), update
  if (daysSinceLastSubmission <= allowUpdateWithin) {
    return { 
      action: 'update', 
      reason: `Updating recent lead (${daysSinceLastSubmission} days old)`,
      leadId: existingLead.id
    };
  }
  
  // If old submission (>30 days), create new
  return { 
    action: 'create', 
    reason: `Creating new lead (previous was ${daysSinceLastSubmission} days ago)` 
  };
}

/**
 * Merge new quiz data with existing lead data
 * Preserves important fields while updating with new information
 */
export function mergeLeadData(existingLead, newData) {
  return {
    ...existingLead,
    ...newData,
    // Preserve status if it was manually set by admin
    status: existingLead.status !== 'new' ? existingLead.status : newData.status || 'new',
    // Preserve admin notes
    admin_notes: existingLead.admin_notes || newData.admin_notes,
    // Track update
    last_quiz_date: new Date().toISOString(),
    quiz_submission_count: (existingLead.quiz_submission_count || 1) + 1
  };
}