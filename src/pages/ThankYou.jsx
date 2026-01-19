import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, Calendar, ArrowRight, Star, Users, Gift, Download, Zap, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import SocialShareButton from '@/components/shared/SocialShareButton';
import { toast } from 'sonner';

export default function ThankYouPage() {
  const [leadData, setLeadData] = useState(null);
   const [analysis, setAnalysis] = useState(null);
   const [showReferral, setShowReferral] = useState(false);
   const [referralCode, setReferralCode] = useState(null);
   const [referralStats, setReferralStats] = useState({ total: 0, converted: 0, credits: 0 });
   const [isCopied, setIsCopied] = useState(false);
   const [isLoadingReferral, setIsLoadingReferral] = useState(false);
   const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('quizLead');
    const storedAnalysis = sessionStorage.getItem('quizAnalysis');

    if (stored) {
      const lead = JSON.parse(stored);
      const analysisData = storedAnalysis ? JSON.parse(storedAnalysis) : null;

      setLeadData(lead);
      setAnalysis(analysisData);

      // Send quiz submission email with analysis
      base44.functions.invoke('sendQuizSubmissionEmail', { 
        leadData: lead,
        analysis: analysisData
      }).catch(err => {
        console.error('Failed to send quiz submission email:', err);
      });
    }
  }, []);

  const generateReferralCode = async () => {
    if (!leadData?.email) {
      toast.error('Email not found. Please contact support.');
      return;
    }

    setIsLoadingReferral(true);

    try {
      const code = `REF_${leadData.email.split('@')[0]}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      const referral = await base44.entities.Referral.create({
        referrer_email: leadData.email,
        referrer_business: leadData.business_name || 'Business',
        referral_code: code,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (!referral) {
        throw new Error('Failed to create referral');
      }

      setReferralCode(code);
      setShowReferral(true);
      
      const stats = await base44.entities.Referral.filter({
        referrer_email: leadData.email
      });
      
      const converted = stats.filter(r => r.status === 'converted').length;
      setReferralStats({
        total: stats.length,
        converted,
        credits: converted * 100
      });

      toast.success('🎉 Referral program activated!');
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast.error(error.message || 'Failed to activate referral program');
    } finally {
      setIsLoadingReferral(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    
    const link = `https://localrank.ai?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    toast.success('Referral link copied to clipboard!');
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareReferralViaEmail = () => {
    if (!referralCode) return;
    
    const link = `https://localrank.ai?ref=${referralCode}`;
    const subject = encodeURIComponent('I Found This Free GMB Score Tool - You Should Try It');
    const body = encodeURIComponent(
      `Hey!\n\nI just got my free GMB (Google My Business) audit score from LocalRank.ai and wanted to share it with you.\n\nCheck it out here: ${link}\n\nIt's completely free and gives you a detailed report on your local search visibility. I'm already getting results!\n\nCheers!`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success('Email compose opened!');
  };

  const downloadAuditPDF = async () => {
    if (!leadData) {
      toast.error('Lead data not available');
      return;
    }

    setIsDownloadingPDF(true);

    try {
      const pdfPayload = { ...leadData, analysis };
      const response = await base44.functions.invoke('generateAuditPDF', pdfPayload);
      
      if (response.status === 200) {
        // Create blob from response data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GMB-Audit-Report-${leadData.business_name?.replace(/\s+/g, '-') || 'Report'}-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        toast.success('✅ Audit report downloaded!');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download audit report');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c8ff00]/10 rounded-full blur-[150px]" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-[#c8ff00]/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[#c8ff00]" />
            </div>
          </motion.div>

          {/* Headline - Personalized */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {leadData?.business_name ? (
              <>
                🎉 Congratulations, <span className="text-[#c8ff00]">{leadData.business_name}</span>!
              </>
            ) : (
              <>
                Welcome to <span className="text-[#c8ff00]">LocalRank.ai</span>!
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 mb-3"
          >
            Your order is confirmed. We're already working on your GMB transformation.
          </motion.p>

          {leadData?.health_score && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-sm text-[#c8ff00]">
                Current Score: {leadData.health_score}/100 • Target: 85+
              </span>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-12"
          >
            {[
              {
                icon: Mail,
                title: 'Check Your Email',
                desc: "We've sent your order confirmation and audit report to your inbox"
              },
              {
                icon: Calendar,
                title: 'Schedule Your Kickoff Call',
                desc: 'Book a time with our team to review your custom optimization plan'
              },
              {
                icon: ArrowRight,
                title: 'See Results in 30 Days',
                desc: "We'll optimize your profile and get you ranking in the Map Pack"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-left"
              >
                <div className="p-3 rounded-xl bg-[#c8ff00]/10 flex-shrink-0">
                  <step.icon className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              onClick={() => window.open('https://calendly.com', '_blank')}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
            >
              Schedule Your Kickoff Call
              <Calendar className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              onClick={downloadAuditPDF}
              disabled={isDownloadingPDF || !leadData}
              className="border-2 border-[#c8ff00] bg-transparent text-[#c8ff00] hover:bg-[#c8ff00] hover:text-black px-10 py-6 text-lg rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingPDF ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 w-5 h-5" />
                  Download Audit PDF
                </>
              )}
            </Button>
          </motion.div>

          {/* Social Proof - Oxytocin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#c8ff00]" />
              <span className="text-white font-semibold">Join 8,900+ Local Business Owners</span>
            </div>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
              ))}
            </div>
            <p className="text-gray-400 text-sm text-center italic">
              "LocalRank.ai took us from invisible to #1 in the Map Pack in 28 days. Our calls tripled!"
            </p>
            <p className="text-gray-500 text-xs text-center mt-2">
              — Sarah M., HVAC Owner
            </p>
          </motion.div>

          {/* Social Sharing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-8"
          >
            <p className="text-gray-400 text-sm mb-3">
              <Share2 className="w-4 h-4 inline mr-1" />
              Help other business owners discover their GMB score:
            </p>
            <SocialShareButton 
              businessName={leadData?.business_name}
              healthScore={leadData?.health_score}
            />
          </motion.div>

          {/* Referral Program - Fully Functional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="w-full max-w-2xl mx-auto"
          >
            {!referralCode ? (
               <Button
                 onClick={generateReferralCode}
                 disabled={isLoadingReferral || !leadData?.email}
                 className="w-full bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold py-6 px-8 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,255,0,0.4)] disabled:opacity-70"
               >
                 {isLoadingReferral ? (
                   <>
                     <span className="animate-spin inline-block mr-2">⏳</span>
                     Activating...
                   </>
                 ) : (
                   <>
                     <Gift className="mr-2 w-5 h-5" />
                     🎁 Unlock $100 Referral Program
                     <ArrowRight className="ml-2 w-5 h-5" />
                   </>
                 )}
               </Button>
             ) : (
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-4 bg-gradient-to-r from-[#c8ff00]/10 to-green-400/10 border border-[#c8ff00]/30 rounded-lg text-center"
               >
                 <p className="text-[#c8ff00] font-semibold">✓ Referral Program Active!</p>
               </motion.div>
             )}

            {showReferral && referralCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-br from-[#c8ff00]/15 via-green-500/10 to-[#c8ff00]/5 border-2 border-[#c8ff00]/50 rounded-2xl p-8 shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-[#c8ff00]/20">
                    <Gift className="w-6 h-6 text-[#c8ff00]" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-white">Your Referral Program</h3>
                    <p className="text-sm text-gray-400">Earn $100 for every referred client who signs up</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-900/40 rounded-lg border border-gray-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#c8ff00]">{referralStats.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Referrals Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{referralStats.converted}</div>
                    <div className="text-xs text-gray-400 mt-1">Converted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">${referralStats.credits}</div>
                    <div className="text-xs text-gray-400 mt-1">Earned Credits</div>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Your Unique Referral Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      readOnly
                      className="flex-1 bg-gray-900 border-2 border-[#c8ff00]/30 rounded-lg px-4 py-3 text-sm text-[#c8ff00] font-mono font-bold"
                    />
                    <Button
                      onClick={copyReferralLink}
                      className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-6 py-3 rounded-lg transition-all"
                    >
                      {isCopied ? (
                        <><Check className="w-4 h-4 mr-2" />Copied</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-2" />Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Share With Friends</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={shareReferralViaEmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Invite
                    </Button>
                    <Button
                      onClick={() => {
                        const link = `https://localrank.ai?ref=${referralCode}`;
                        if (navigator.share) {
                          navigator.share({
                            title: 'Free GMB Audit',
                            text: 'Check out this free tool that scores your Google My Business profile!',
                            url: link
                          });
                        } else {
                          toast.info('Use email or copy link to share');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-4 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-lg">
                  <p className="text-sm text-gray-300">
                    💡 <span className="font-semibold">Pro Tip:</span> Share with business owners in your network. Credits apply to future services!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-gray-600 text-sm mt-12"
          >
            Questions? Email us at <span className="text-[#c8ff00]">support@localrank.ai</span>
          </motion.p>
        </div>
      </div>
    </div>
  );
}