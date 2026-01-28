import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FoxyHealthScore from '@/components/foxyv2/FoxyHealthScore';
import RevenueLeakCalculator from '@/components/foxyv2/RevenueLeakCalculator';
import GeoHeatmapDisplay from '@/components/foxyv2/GeoHeatmapDisplay';
import AIVisibilityReport from '@/components/foxyv2/AIVisibilityReport';

export default function FoxyAudit() {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('health'); // health, revenue, heatmap, ai, complete
  const [auditData, setAuditData] = useState({
    health: null,
    revenue: null,
    heatmap: null,
    ai: null
  });

  // Mock lead data for demo
  const mockLead = {
    id: 'demo_lead',
    business_name: 'Elite Junk Removal',
    place_id: 'ChIJdQiP3dLGwokRLGzb2Ww7FrI',
    location: { lat: 39.2904, lng: -76.6122 },
    address: '123 Main St, Baltimore, MD',
    phone: '410-555-0123',
    website: 'https://elitejunk.com',
    gmb_rating: 4.2,
    gmb_reviews_count: 47,
    gmb_photos_count: 28,
    gmb_has_hours: true,
    gmb_types: ['moving_company', 'waste_management']
  };

  useEffect(() => {
    runFoxyAudit();
  }, []);

  const runFoxyAudit = async () => {
    try {
      setLoading(true);

      // Step 1: Advanced Health Score
      const healthResponse = await base44.functions.invoke('geeniusv2/advancedHealthScore', {
        placeId: mockLead.place_id,
        gmbData: mockLead
      });

      setAuditData(prev => ({ ...prev, health: healthResponse.data.data }));
      setStage('revenue');

      // Step 2: Revenue Opportunity
      const revenueResponse = await base44.functions.invoke('geeniusv2/revenueOpportunity', {
        keyword: 'junk removal',
        location: 'Baltimore, MD',
        currentRank: 9,
        avgOrderValue: 300
      });

      setAuditData(prev => ({ ...prev, revenue: revenueResponse.data.data }));
      setStage('heatmap');

      // Step 3: Geo Heatmap
      const heatmapResponse = await base44.functions.invoke('geeniusv2/geoHeatmap', {
        placeId: mockLead.place_id,
        businessName: mockLead.business_name,
        location: mockLead.location,
        keyword: 'junk removal baltimore',
        radiusMiles: 5
      });

      setAuditData(prev => ({ ...prev, heatmap: heatmapResponse.data.data }));
      setStage('ai');

      // Step 4: AI Visibility
      const aiResponse = await base44.functions.invoke('geeniusv2/aiVisibilityCheck', {
        businessName: mockLead.business_name,
        location: 'Baltimore, MD',
        keyword: 'junk removal',
        industry: 'waste_management'
      });

      setAuditData(prev => ({ ...prev, ai: aiResponse.data.data }));
      setStage('complete');

    } catch (error) {
      console.error('Foxy audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && stage === 'health') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-16 h-16 text-[#c8ff00] mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">🦊 Foxy is investigating...</h2>
          <p className="text-gray-400">Sniffing out revenue leaks and competitor advantages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] py-12 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(200,255,0,0.15),rgba(0,0,0,0))]" />
        <div className="absolute top-0 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-[#c8ff00]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-6xl">🦊</span>
            </motion.div>
            <h1 className="text-5xl font-black text-white">
              Foxy's <span className="text-[#c8ff00]">Complete Audit</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            {mockLead.business_name}
          </p>
          <p className="text-gray-500">{mockLead.address}</p>
        </motion.div>

        {/* Audit Results */}
        <div className="space-y-8">
          {/* Health Score */}
          {auditData.health && (
            <FoxyHealthScore
              scoreData={auditData.health}
              onRevealComplete={() => {}}
            />
          )}

          {/* Revenue Leak */}
          {stage !== 'health' && auditData.revenue && (
            <RevenueLeakCalculator revenueData={auditData.revenue} />
          )}

          {/* Geo Heatmap */}
          {(stage === 'heatmap' || stage === 'ai' || stage === 'complete') && auditData.heatmap && (
            <GeoHeatmapDisplay heatmapData={auditData.heatmap} />
          )}

          {/* AI Visibility */}
          {(stage === 'ai' || stage === 'complete') && auditData.ai && (
            <AIVisibilityReport aiData={auditData.ai} />
          )}

          {/* Fix with Foxy CTA */}
          {stage === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-[#c8ff00] via-[#00ff88] to-[#c8ff00] p-1 rounded-2xl"
            >
              <div className="bg-gray-900 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🦊</div>
                <h2 className="text-3xl font-black text-white mb-4">
                  Let Foxy Fix This For You
                </h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  I've identified {auditData.health?.criticalIssues?.length || 0} critical issues 
                  costing you ${auditData.revenue?.monthlyOpportunity?.toLocaleString() || 0}/month. 
                  Click below to start your automated AEO campaign.
                </p>
                <Button
                  size="lg"
                  className="bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-bold text-xl px-12 py-6 h-auto"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  Fix with Foxy - $497/mo
                </Button>
                <p className="text-gray-500 text-sm mt-4">
                  🚀 Get listed on "Best-of" directories • 📍 Optimize for local AI search • 
                  ⚡ Automated GMB posting • 💬 Review management
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}