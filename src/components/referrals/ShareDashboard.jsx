import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Check, Twitter, Linkedin, Facebook, Mail, MessageSquare, Gift, Zap, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
  const creditAmount = 100; // Credits per successful referral
  const shareText = `I just unlocked my Google Business Profile potential! Get your FREE LocalRank.ai audit and boost your local visibility 🚀`;

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
    const body = `Hey,\n\n${shareText}\n\n${referralUrl}\n\nWhen you purchase, we both get ${creditAmount} credits!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    base44.analytics.track({ eventName: 'share_email', properties: { lead_id: leadId } });
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${referralUrl}`)}`;
    window.open(url, '_blank');
    base44.analytics.track({ eventName: 'share_whatsapp', properties: { lead_id: leadId } });
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#c8ff00]/10 via-purple-900/20 to-blue-900/10 border-[#c8ff00]/30 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#c8ff00]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white flex items-center gap-2 text-2xl mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Gift className="w-6 h-6 text-[#c8ff00]" />
              </motion.div>
              Share & Earn Credits
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Invite friends and earn <span className="text-[#c8ff00] font-bold">{creditAmount} credits</span> each when they upgrade!
            </CardDescription>
          </div>
          <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/50 text-sm px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            {creditAmount} Credits
          </Badge>
        </div>
        
        {/* How it works */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50"
          >
            <Share2 className="w-5 h-5 text-[#c8ff00] mx-auto mb-1" />
            <div className="text-xs text-gray-400">Share Link</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50"
          >
            <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400">Friend Upgrades</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50"
          >
            <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400">Both Get Credits</div>
          </motion.div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-5">
        {/* Referral Link */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Your Unique Referral Link</div>
            {copied && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-xs text-green-400"
              >
                <Check className="w-3 h-3" />
                Copied!
              </motion.div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 text-gray-300 px-4 py-3 rounded-lg text-sm font-mono border border-gray-700/50 overflow-hidden text-ellipsis whitespace-nowrap">
              {referralUrl || 'Loading...'}
            </div>
            <Button 
              onClick={copyToClipboard} 
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-6 shadow-lg hover:shadow-[#c8ff00]/20"
              disabled={!referralUrl}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* Quick Share Buttons */}
        <div>
          <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#c8ff00]" />
            Share Your Link:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={shareOnTwitter}
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-blue-600/30 hover:border-blue-500/50 transition-all"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={shareOnLinkedIn}
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-blue-700/30 hover:border-blue-600/50 transition-all"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={shareOnFacebook}
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-blue-500/30 hover:border-blue-400/50 transition-all"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={shareViaEmail}
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-600/30 hover:border-gray-500/50 transition-all"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={shareViaWhatsApp}
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-green-600/30 hover:border-green-500/50 transition-all"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        {referralData?.referral && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-5 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#c8ff00]" />
              <div className="text-sm font-semibold text-white">Your Referral Performance</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#c8ff00] mb-1">0</div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">0</div>
                <div className="text-xs text-gray-400">Converted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 flex items-center justify-center gap-1">
                  0
                  <Zap className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div className="text-xs text-gray-400">Credits Earned</div>
              </div>
            </div>
            
            {/* Credit value explanation */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Gift className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  Credits can be used towards any LocalRank.ai service. Each successful referral earns you <span className="text-[#c8ff00] font-semibold">{creditAmount} credits</span>!
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}