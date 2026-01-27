import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

// Import all potential quiz pages
import QuizGeenius from './QuizGeenius';
import QuizV3 from './QuizV3';
import QuizV2 from './QuizV2';

export default function HomePage() {
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveFunnel();
  }, []);

  const loadActiveFunnel = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'active_funnel_mode'
      });

      if (settings.length > 0) {
        const funnelId = settings[0].setting_value.funnel_id || 'geenius';
        setActiveFunnel(funnelId);
        
        // Track funnel view
        await base44.analytics.track({
          eventName: 'funnel_viewed',
          properties: {
            funnel_id: funnelId,
            timestamp: Date.now()
          }
        });
      } else {
        // Default to geenius if no setting exists
        setActiveFunnel('geenius');
      }
    } catch (error) {
      console.error('Error loading funnel mode:', error);
      // Fallback to geenius on error
      setActiveFunnel('geenius');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#c8ff00] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate funnel based on admin setting
  switch (activeFunnel) {
    case 'v3':
      return <QuizV3 />;
    case 'v2':
      return <QuizV2 />;
    case 'geenius':
    default:
      return <QuizGeenius />;
  }
}