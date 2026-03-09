/**
 * ReferralCTA — inline referral prompt for success moments
 * Used on: BridgeGeenius, ResultsGeenius (post-CTA area)
 *
 * Props:
 *   email        — referrer email (to look up/create referral record)
 *   businessName — referrer business name
 *   context      — 'bridge' | 'results' | 'thankyou'  (for tracking)
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ReferralCTA({ email, businessName, context = 'results' }) {
  const [open, setOpen] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Attempt to find an existing referral code for this email on expand
  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);

    if (referralCode || !email) return;
    setLoading(true);

    try {
      const existing = await base44.entities.Referral.filter({ referrer_email: email }, '-created_date', 1);
      if (existing.length > 0 && existing[0].referral_code) {
        setReferralCode(existing[0].referral_code);
      } else {
        // Create a new one
        const code = `REF_${email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await base44.entities.Referral.create({
          referrer_email: email,
          referrer_business: businessName || 'Business',
          referral_code: code,
          status: 'pending',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        });
        setReferralCode(code);
      }

      base44.analytics.track({
        eventName: 'referral_link_viewed',
        properties: { context, email }
      });
    } catch (err) {
      console.error('Referral load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = referralCode
    ? `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/') || ''}/QuizGeenius?ref=${referralCode}`
    : null;

  // Use the canonical domain if available
  const shareUrl = referralCode ? `https://localrank.ai/QuizGeenius?ref=${referralCode}` : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    base44.analytics.track({ eventName: 'referral_link_copied', properties: { context, code: referralCode } });
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = () => {
    if (!shareUrl) return;
    if (navigator.share) {
      navigator.share({
        title: 'Free GMB Audit — LocalRank.ai',
        text: 'Know a business struggling to show up on Google? Get their free audit score here:',
        url: shareUrl
      }).catch(() => {});
    } else {
      handleCopy();
    }
    base44.analytics.track({ eventName: 'referral_shared', properties: { context, method: navigator.share ? 'native' : 'copy' } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#c8ff00]/30 bg-[#c8ff00]/5 overflow-hidden"
    >
      {/* Collapsed trigger */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-[#c8ff00] flex-shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">Know another business struggling on Google?</p>
            <p className="text-gray-400 text-xs mt-0.5">Send them a free audit — earn $100 when they sign up</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#c8ff00]/20">
              {loading ? (
                <p className="text-gray-400 text-sm">Getting your referral link…</p>
              ) : referralCode ? (
                <>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-[#c8ff00] font-mono truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    You earn $100 credit for every referred business that signs up.
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Unable to generate referral link. Please try again.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}