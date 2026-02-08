import { useEffect } from 'react';
import { trackConversion } from './RemarketingPixels';

// Conversion tracking component for key funnel events
export default function ConversionTracker({ event, data = {} }) {
  useEffect(() => {
    if (event) {
      trackConversion(event, data);
    }
  }, [event, data]);

  return null;
}

// Pre-defined conversion events
export const CONVERSION_EVENTS = {
  // Landing page events
  LANDING_PAGE_VIEW: 'ViewContent',
  SCROLL_50: 'ScrollDepth50',
  SCROLL_75: 'ScrollDepth75',
  
  // Quiz events
  QUIZ_START: 'InitiateCheckout',
  QUIZ_STEP_1: 'AddToCart',
  QUIZ_STEP_3: 'AddPaymentInfo',
  QUIZ_COMPLETE: 'Lead',
  
  // CTA events
  CTA_CLICK: 'ClickButton',
  EMAIL_SUBMIT: 'CompleteRegistration',
  
  // Audit events
  AUDIT_VIEW: 'ViewAuditResults',
  AUDIT_DOWNLOAD: 'Download',
  
  // Purchase intent
  PRICING_VIEW: 'ViewPricing',
  CHECKOUT_START: 'InitiateCheckout',
  PURCHASE: 'Purchase',
};

// Helper to track funnel progression
export const trackFunnelStep = (stepName, stepNumber, metadata = {}) => {
  trackConversion('FunnelStep', {
    step_name: stepName,
    step_number: stepNumber,
    ...metadata
  });
};