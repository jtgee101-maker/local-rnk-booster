import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ABTestContext = createContext();

export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider');
  }
  return context;
};

export function ABTestProvider({ children }) {
  const [tests, setTests] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or create session ID
    let sid = sessionStorage.getItem('ab_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ab_session_id', sid);
    }
    setSessionId(sid);

    // Load active tests
    loadActiveTests();
  }, []);

  const loadActiveTests = async () => {
    try {
      const activeTests = await base44.entities.ABTest.filter({ status: 'active' });
      
      const testsMap = {};
      for (const test of activeTests) {
        const variantId = getOrAssignVariant(test);
        testsMap[`${test.page}_${test.element}`] = {
          testId: test.id,
          variantId,
          variant: test.variants.find(v => v.id === variantId)
        };
      }
      
      setTests(testsMap);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading A/B tests:', error);
      setIsLoading(false);
    }
  };

  const getOrAssignVariant = (test) => {
    const storageKey = `ab_variant_${test.id}`;
    let variantId = sessionStorage.getItem(storageKey);
    
    if (!variantId) {
      // Assign variant based on traffic split
      const rand = Math.random() * 100;
      let cumulative = 0;
      
      for (const [vId, percentage] of Object.entries(test.traffic_split || {})) {
        cumulative += percentage;
        if (rand <= cumulative) {
          variantId = vId;
          break;
        }
      }
      
      // Fallback to first variant
      if (!variantId) {
        variantId = test.variants[0]?.id;
      }
      
      sessionStorage.setItem(storageKey, variantId);
    }
    
    return variantId;
  };

  const getVariant = (page, element) => {
    const key = `${page}_${element}`;
    return tests[key];
  };

  const trackView = async (page, element) => {
    const variant = getVariant(page, element);
    if (!variant || !sessionId) return;

    try {
      await base44.entities.ABTestEvent.create({
        test_id: variant.testId,
        variant_id: variant.variantId,
        session_id: sessionId,
        event_type: 'view'
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackConversion = async (page, element, value = 0, metadata = {}) => {
    const variant = getVariant(page, element);
    if (!variant || !sessionId) return;

    try {
      await base44.entities.ABTestEvent.create({
        test_id: variant.testId,
        variant_id: variant.variantId,
        session_id: sessionId,
        event_type: 'conversion',
        conversion_value: value,
        metadata
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  return (
    <ABTestContext.Provider value={{ 
      getVariant, 
      trackView, 
      trackConversion, 
      isLoading 
    }}>
      {children}
    </ABTestContext.Provider>
  );
}