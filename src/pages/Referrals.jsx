import React from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Award, Trophy } from 'lucide-react';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';
import AffiliatePortal from '@/components/referrals/AffiliatePortal';
import Leaderboard from '@/components/referrals/Leaderboard';

export default function ReferralsPage() {
  return (
    <>
      <Helmet>
        <title>Referral Program - LocalRank.ai | Earn Commissions</title>
        <meta name="description" content="Join our referral program and earn recurring commissions for every business you refer." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Referral Program</h1>
            <p className="text-gray-400">Earn recurring commissions by referring businesses to LocalRank.ai</p>
          </div>
          <Tabs defaultValue="referrals" className="space-y-6">
            <TabsList className="bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm">
              <TabsTrigger value="referrals" className="data-[state=active]:text-[#c8ff00] data-[state=active]:border-[#c8ff00]">
                <Gift className="w-4 h-4 mr-2" />
                My Referrals
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="data-[state=active]:text-[#c8ff00] data-[state=active]:border-[#c8ff00]">
                <Award className="w-4 h-4 mr-2" />
                Affiliate Portal
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:text-[#c8ff00] data-[state=active]:border-[#c8ff00]">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

          <TabsContent value="referrals">
            <ReferralDashboard />
          </TabsContent>

          <TabsContent value="affiliate">
            <AffiliatePortal />
          </TabsContent>

            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}