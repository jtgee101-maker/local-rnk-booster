import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Users, Award, Download, Copy } from 'lucide-react';

export default function AffiliatePortal() {
  const { data: affiliate, isLoading } = useQuery({
    queryKey: ['my-affiliate'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const response = await base44.entities.Affiliate.filter({ 
        email: user.email 
      }, 'created_date', 1);
      return response[0] || null;
    }
  });

  const { data: referrals } = useQuery({
    queryKey: ['affiliate-referrals'],
    queryFn: async () => {
      if (!affiliate) return [];
      const response = await base44.entities.Referral.filter({ 
        referral_code: { $regex: affiliate.affiliate_code }
      }, '-created_date', 100);
      return response;
    },
    enabled: !!affiliate,
    initialData: []
  });

  if (!affiliate) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 text-center">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-xl font-bold mb-2">Become an Affiliate</h3>
          <p className="text-gray-400 mb-6">
            Earn 30% recurring commission on every customer you refer
          </p>
          <Button>Apply for Affiliate Program</Button>
        </CardContent>
      </Card>
    );
  }

  const tierColors = {
    bronze: 'bg-orange-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-500" />
            Affiliate Portal
          </h2>
          <p className="text-gray-400 mt-1">Earn {affiliate.commission_rate}% recurring commissions</p>
        </div>
        <Badge className={tierColors[affiliate.tier]}>
          {affiliate.tier.toUpperCase()} Tier
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-green-700/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300">Total Earned</div>
                <div className="text-3xl font-bold text-white">
                  ${affiliate.total_commission_earned?.toFixed(2) || '0.00'}
                </div>
              </div>
              <DollarSign className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-300">Pending</div>
                <div className="text-3xl font-bold text-white">
                  ${affiliate.pending_commission?.toFixed(2) || '0.00'}
                </div>
              </div>
              <TrendingUp className="w-10 h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-300">Conversions</div>
                <div className="text-3xl font-bold text-white">
                  {affiliate.successful_conversions || 0}
                </div>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-300">Commission Rate</div>
                <div className="text-3xl font-bold text-white">
                  {affiliate.commission_rate}%
                </div>
              </div>
              <Award className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Affiliate Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={`https://localrank.ai/quiz-v3?aff=${affiliate.affiliate_code}`}
              readOnly
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg"
            />
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(`https://localrank.ai/quiz-v3?aff=${affiliate.affiliate_code}`);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="referrals">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="resources">Marketing Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No referrals yet. Start promoting your affiliate link!
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {ref.referred_business || ref.referred_email || 'Pending'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(ref.created_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={
                        ref.status === 'converted' ? 'bg-green-500' :
                        ref.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }>
                        {ref.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                No payouts yet. Minimum payout threshold: $100
              </div>
              {affiliate.pending_commission >= 100 && (
                <Button className="w-full">
                  Request Payout (${affiliate.pending_commission.toFixed(2)})
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Marketing Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Email Template</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Pre-written email you can send to your network
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Social Media Graphics</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Ready-to-post images for Instagram, Twitter, LinkedIn
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Pack
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}