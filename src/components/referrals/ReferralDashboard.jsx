import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Users, DollarSign, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralDashboard() {
  const [copied, setCopied] = React.useState(false);

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const response = await base44.entities.Referral.filter({ 
        referrer_email: user.email 
      }, '-created_date', 100);
      return response;
    },
    initialData: []
  });

  const { data: referralLink } = useQuery({
    queryKey: ['my-referral-link'],
    queryFn: async () => {
      const response = await base44.functions.invoke('referrals/createReferral', {});
      return response.data;
    }
  });

  const { data: suggestions } = useQuery({
    queryKey: ['referral-suggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('referrals/suggestReferrals', {});
      return response.data;
    }
  });

  const pending = referrals.filter(r => r.status === 'pending').length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const totalEarned = converted * 100; // $100 per conversion

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink?.referral_url || '');
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-500" />
          Referral Program
        </h2>
        <p className="text-gray-400 mt-1">Earn $100 for every friend who purchases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-300">Pending</div>
                <div className="text-3xl font-bold text-white">{pending}</div>
              </div>
              <Users className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-green-700/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300">Converted</div>
                <div className="text-3xl font-bold text-white">{converted}</div>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-300">Total Earned</div>
                <div className="text-3xl font-bold text-white">${totalEarned}</div>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-300">Success Rate</div>
                <div className="text-3xl font-bold text-white">
                  {referrals.length > 0 ? Math.round((converted / referrals.length) * 100) : 0}%
                </div>
              </div>
              <Sparkles className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink?.referral_url || 'Loading...'}
              readOnly
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg"
            />
            <Button onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            Share this link with friends. When they purchase, you both get $100 credit!
          </p>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Who to Refer (AI Suggestions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.suggestions.slice(0, 5).map((suggestion, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {suggestion.business_name && (
                        <div className="text-white font-semibold">{suggestion.business_name}</div>
                      )}
                      <div className="text-sm text-gray-400 mt-1">{suggestion.reason}</div>
                    </div>
                    <Badge className={
                      suggestion.likelihood === 'high' ? 'bg-green-500' :
                      suggestion.likelihood === 'medium' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }>
                      {suggestion.likelihood} match
                    </Badge>
                  </div>
                  {suggestion.examples && (
                    <div className="text-xs text-gray-500 mt-2">
                      Examples: {suggestion.examples.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No referrals yet. Start sharing your link to earn credits!
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {referral.referred_business || referral.referred_email || 'Pending signup'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Code: {referral.referral_code}
                    </div>
                  </div>
                  <Badge className={
                    referral.status === 'converted' ? 'bg-green-500' :
                    referral.status === 'pending' ? 'bg-yellow-500' :
                    referral.status === 'expired' ? 'bg-red-500' :
                    'bg-gray-500'
                  }>
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}