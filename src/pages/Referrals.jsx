import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Award, Trophy } from 'lucide-react';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';
import AffiliatePortal from '@/components/referrals/AffiliatePortal';
import Leaderboard from '@/components/referrals/Leaderboard';

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="referrals">
              <Gift className="w-4 h-4 mr-2" />
              My Referrals
            </TabsTrigger>
            <TabsTrigger value="affiliate">
              <Award className="w-4 h-4 mr-2" />
              Affiliate Portal
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
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
  );
}