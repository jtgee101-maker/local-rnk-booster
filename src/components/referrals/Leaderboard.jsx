import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const { data: topReferrers, isLoading } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: async () => {
      // Get all referrals
      const referrals = await base44.entities.Referral.list('-created_date', 1000);
      
      // Group by referrer and count conversions
      const stats = {};
      referrals.forEach(ref => {
        if (!stats[ref.referrer_email]) {
          stats[ref.referrer_email] = {
            email: ref.referrer_email,
            business: ref.referrer_business,
            total: 0,
            converted: 0
          };
        }
        stats[ref.referrer_email].total++;
        if (ref.status === 'converted') {
          stats[ref.referrer_email].converted++;
        }
      });

      // Convert to array and sort by conversions
      return Object.values(stats)
        .sort((a, b) => b.converted - a.converted)
        .slice(0, 10);
    },
    initialData: []
  });

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-600" />;
    return <Award className="w-5 h-5 text-gray-600" />;
  };

  const getRankColor = (index) => {
    if (index === 0) return 'from-yellow-900/30 to-yellow-700/10 border-yellow-500/30';
    if (index === 1) return 'from-gray-700/30 to-gray-600/10 border-gray-400/30';
    if (index === 2) return 'from-orange-900/30 to-orange-700/10 border-orange-500/30';
    return 'from-gray-800/30 to-gray-700/10 border-gray-600/30';
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Top Referrers
        </CardTitle>
        <p className="text-sm text-gray-400">Monthly referral champions</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>
        ) : topReferrers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Be the first to make it to the leaderboard!
          </div>
        ) : (
          <div className="space-y-3">
            {topReferrers.map((referrer, index) => (
              <Card key={referrer.email} className={`bg-gradient-to-br ${getRankColor(index)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {referrer.business || referrer.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-400">
                          {referrer.converted} conversions • {referrer.total} referrals
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#c8ff00]">
                        #{index + 1}
                      </div>
                      {index < 3 && (
                        <Badge className="bg-purple-500 mt-1">
                          Winner
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Monthly Prize Info */}
        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400 mt-1" />
            <div>
              <div className="text-white font-semibold mb-1">Monthly Prizes</div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>🥇 1st Place: $500 cash + Platinum tier upgrade</div>
                <div>🥈 2nd Place: $300 cash + Gold tier upgrade</div>
                <div>🥉 3rd Place: $200 cash + Silver tier upgrade</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}