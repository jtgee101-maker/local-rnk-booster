import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Users, DollarSign, Sparkles, Copy, Check, MousePointer } from 'lucide-react';
import { toast } from 'sonner';

const REWARD_PER_CONVERSION = 100;

export default function ReferralDashboard() {
  const [copied, setCopied] = useState(false);

  // 1. Current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // 2. All referrals for this user
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['my-referrals', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 100),
  });

  // 3. Referral visit events (for click counting)
  const referralCodes = referrals.map(r => r.referral_code).filter(Boolean);
  const { data: visitEvents = [] } = useQuery({
    queryKey: ['referral-visits', user?.email],
    enabled: referralCodes.length > 0,
    queryFn: () => base44.entities.ConversionEvent.filter({ event_name: 'referral_lead_created' }, '-created_date', 500),
  });

  // 4. Get or create the user's primary referral code
  const { data: myCode, isLoading: codeLoading } = useQuery({
    queryKey: ['my-referral-code', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const existing = await base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 1);
      if (existing.length > 0) return existing[0].referral_code;
      // Auto-create
      const code = `REF_${user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await base44.entities.Referral.create({
        referrer_email: user.email,
        referrer_business: user.full_name || 'LocalRank User',
        referral_code: code,
        status: 'pending',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
      return code;
    }
  });

  const shareUrl = myCode ? `https://localrank.ai/QuizGeenius?ref=${myCode}` : '';

  // Stats
  const pending = referrals.filter(r => r.status === 'pending').length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const totalEarned = converted * REWARD_PER_CONVERSION;
  const successRate = referrals.length > 0 ? Math.round((converted / referrals.length) * 100) : 0;

  // Click count = referral_lead_created events that match any of our codes
  const totalClicks = visitEvents.filter(e =>
    e.properties?.referral_code && referralCodes.includes(e.properties.referral_code)
  ).length;

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    base44.analytics.track({ eventName: 'referral_link_copied', properties: { context: 'dashboard' } });
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const REWARD_STATUS_STYLE = {
    pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
    converted: { label: 'Earned',    cls: 'bg-green-500/20 text-green-400 border-green-500/40' },
    expired:   { label: 'Expired',   cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
    paid:      { label: 'Paid Out',  cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-500" />
          Referral Program
        </h2>
        <p className="text-gray-400 mt-1">Earn ${REWARD_PER_CONVERSION} for every friend who purchases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Referred', value: referrals.length, icon: Users, color: 'purple' },
          { label: 'Referred Leads', value: totalClicks, icon: MousePointer, color: 'blue' },
          { label: 'Converted', value: converted, icon: TrendingUp, color: 'green' },
          { label: 'Total Earned', value: `$${totalEarned}`, icon: DollarSign, color: 'yellow' },
          { label: 'Conversion Rate', value: `${successRate}%`, icon: Sparkles, color: 'pink' }
        ].map(({ label, value, icon: StatIcon, color }) => (
          <Card key={label} className="bg-gray-900/60 border-gray-800">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                </div>
                <StatIcon className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Link */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          {codeLoading ? (
            <p className="text-gray-400 text-sm">Generating your link…</p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg text-sm font-mono"
                />
                <Button onClick={copyLink} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-5">
                  {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Share this link. When a referred business purchases, you both earn ${REWARD_PER_CONVERSION} credit.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : referrals.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No referrals yet. Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const s = REWARD_STATUS_STYLE[referral.status] || REWARD_STATUS_STYLE.pending;
                return (
                  <div key={referral.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">
                        {referral.referred_business || referral.referred_email || 'Pending signup'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Code: <span className="font-mono">{referral.referral_code}</span>
                        {referral.converted_date && (
                          <> · Converted {new Date(referral.converted_date).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {referral.status === 'converted' && (
                        <span className="text-sm font-bold text-green-400">+${REWARD_PER_CONVERSION}</span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}