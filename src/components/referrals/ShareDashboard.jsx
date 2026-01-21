import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Check, Twitter, Linkedin, Facebook, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareDashboard({ leadId, healthScore, businessName }) {
  const [copied, setCopied] = useState(false);

  const { data: referralData } = useQuery({
    queryKey: ['referral-link', leadId],
    queryFn: async () => {
      const response = await base44.functions.invoke('referrals/createReferral', {
        referrer_email: null // Uses current user
      });
      return response.data;
    }
  });

  const referralUrl = referralData?.referral_url || '';
  const shareText = `I just discovered my Google Business Profile was costing me $${Math.round((100 - (healthScore || 50)) * 150)}/month! Get your FREE audit at LocalRank.ai 🚀`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    base44.analytics.track({ eventName: 'share_twitter', properties: { lead_id: leadId } });
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    base44.analytics.track({ eventName: 'share_linkedin', properties: { lead_id: leadId } });
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    base44.analytics.track({ eventName: 'share_facebook', properties: { lead_id: leadId } });
  };

  const shareViaEmail = () => {
    const subject = 'Check out this free GMB audit tool';
    const body = `Hey,\n\n${shareText}\n\n${referralUrl}\n\nIf you purchase, we both get $100 credit!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    base44.analytics.track({ eventName: 'share_email', properties: { lead_id: leadId } });
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${referralUrl}`)}`;
    window.open(url, '_blank');
    base44.analytics.track({ eventName: 'share_whatsapp', properties: { lead_id: leadId } });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-700/10 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-400" />
          Share & Earn $100 Credit
        </CardTitle>
        <p className="text-sm text-gray-400">
          When your friend purchases, you both get $100 credit!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-2">Your Referral Link</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 bg-gray-900 text-white px-3 py-2 rounded text-sm"
            />
            <Button onClick={copyToClipboard} variant="outline">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div>
          <div className="text-sm text-gray-400 mb-3">Share on:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={shareOnTwitter}
              className="bg-gray-800 border-gray-700 hover:bg-blue-600/20"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              onClick={shareOnLinkedIn}
              className="bg-gray-800 border-gray-700 hover:bg-blue-700/20"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              onClick={shareOnFacebook}
              className="bg-gray-800 border-gray-700 hover:bg-blue-500/20"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button 
              variant="outline" 
              onClick={shareViaEmail}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              onClick={shareViaWhatsApp}
              className="bg-gray-800 border-gray-700 hover:bg-green-600/20"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Stats */}
        {referralData?.referral && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-2">Your Referral Stats</div>
            <div className="flex gap-4">
              <div>
                <div className="text-2xl font-bold text-[#c8ff00]">0</div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-xs text-gray-400">Converted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-xs text-gray-400">Earned</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}