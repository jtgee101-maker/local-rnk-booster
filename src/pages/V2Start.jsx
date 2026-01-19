import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Zap, TrendingUp, AlertTriangle, X, CheckCircle, Users, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import LegalFooter from '@/components/shared/LegalFooter';

const villainLogos = [
  { name: 'Thumbtack', cost: '$100/lead', issue: 'Sold to 5 competitors' },
  { name: 'HomeAdvisor', cost: '$150/lead', issue: 'No exclusivity' },
  { name: 'Angi', cost: '$125/lead', issue: 'Fake phone numbers' },
  { name: 'Scorpion', cost: '$2,000/mo', issue: 'Contract lock-in' },
  { name: 'Olly Olly', cost: '$1,800/mo', issue: 'Leads disappear when you stop' },
  { name: 'Web.com', cost: '$1,500/mo', issue: 'Zero ownership' }
];

const testimonials = [
  {
    text: "I was spending $3,200/mo on HomeAdvisor. Within 30 days of using this software, I was Top 3 in the Map Pack and stopped buying leads forever.",
    author: "Mike Rodriguez",
    business: "Rodriguez Plumbing, Miami FL",
    saved: "$38,400/year"
  },
  {
    text: "Scorpion had me locked into a $24,000/year contract. This AI does everything they did in 28 seconds. I own my leads now.",
    author: "Sarah Chen",
    business: "Chen's HVAC, Phoenix AZ",
    saved: "$24,000/year"
  },
  {
    text: "Thumbtack was selling my leads to 5 other contractors. Now I'm #1 in the Map Pack. My phone hasn't stopped ringing.",
    author: "David Martinez",
    business: "Martinez Roofing, Austin TX",
    saved: "$42,000/year"
  }
];

export default function V2StartPage() {
  const navigate = useNavigate();
  const [revenueStolen, setRevenueStolen] = useState(15000);

  useEffect(() => {
    base44.analytics.track({ eventName: 'v2_landing_viewed' });
    
    // Animate counter
    const interval = setInterval(() => {
      setRevenueStolen(prev => prev + Math.floor(Math.random() * 500 + 100));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartScan = () => {
    base44.analytics.track({ eventName: 'v2_scan_started' });
    sessionStorage.setItem('quizVersion', 'v2');
    navigate(createPageUrl('QuizV2'));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="p-6 border-b border-gray-800/50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-[#c8ff00] font-bold text-2xl tracking-tight">
              LocalRank<span className="text-white">.ai</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-400 text-sm font-semibold">LEAD THEFT DETECTED</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Pattern Interrupt Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-3 mb-8"
            >
              <Zap className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold">STOP THE LEAD HEIST</span>
            </motion.div>

            {/* Headline - Dopamine Hook */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Stop Paying <span className="text-red-400">Thumbtack</span> to Sell<br />
              Your Customers to <span className="text-red-400">5 Competitors</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto">
              Are you tired of paying Angi, HomeAdvisor, and Thumbtack to sell the <span className="text-red-400 font-semibold">same lead</span> to your competitors?
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Stop funding their growth. Start fueling yours.
            </p>

            {/* Revenue Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/50 border-2 border-red-500/30 rounded-2xl p-6 mb-10 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <DollarSign className="w-8 h-8 text-red-400" />
                <div className="text-left">
                  <div className="text-sm text-gray-500 mb-1">Revenue Stolen This Month</div>
                  <div className="text-4xl font-bold text-red-400">
                    ${revenueStolen.toLocaleString()}+
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Lost by local businesses to lead-sharing platforms
              </p>
            </motion.div>

            {/* CTA */}
            <Button
              onClick={handleStartScan}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-lg px-12 py-8 rounded-xl shadow-[0_0_40px_rgba(200,255,0,0.3)] hover:scale-105 transition-all mb-4"
            >
              <Zap className="w-5 h-5 mr-2" />
              Run My Lead-Ownership Scan
            </Button>
            <p className="text-gray-600 text-sm">
              60-second AI scan • No credit card • See exactly where you're losing revenue
            </p>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 flex-wrap text-gray-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c8ff00]" />
              <span>7M+ Businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#c8ff00]" />
              <span>30-Day Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#c8ff00]" />
              <span>4.9★ Rating</span>
            </div>
          </motion.div>
        </section>

        {/* Wall of Shame - The Villains */}
        <section className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-800/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-4">
                <span className="text-red-400 font-semibold text-sm">THE LEAD-GEN TRAP</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                The Aggregator Cartel
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                These platforms auction off your livelihood to the highest bidder while you pay for the privilege
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {villainLogos.map((villain, index) => (
                <motion.div
                  key={villain.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="relative bg-gray-900/30 border border-red-500/20 rounded-xl p-6 text-center"
                >
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{villain.name}</h3>
                  <div className="text-red-400 font-semibold mb-2">{villain.cost}</div>
                  <p className="text-gray-500 text-sm">{villain.issue}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* The Solution */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border-2 border-[#c8ff00] rounded-3xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                The Easy Way to <span className="text-[#c8ff00]">Own Your Market</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Stop renting your growth. Start owning it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                {
                  icon: X,
                  title: 'Stop Paying for Shared Leads',
                  description: 'No more $100+ leads sold to 5 competitors. Own your rankings instead.'
                },
                {
                  icon: DollarSign,
                  title: 'Cut $2,000/mo Agency Fees',
                  description: 'Our AI does in 28 seconds what Scorpion charges $24,000/year for.'
                },
                {
                  icon: Shield,
                  title: 'Build a GMB Fortress',
                  description: 'Permanent digital equity competitors can\'t touch. You own the leads.'
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6"
                >
                  <div className="p-3 bg-[#c8ff00]/20 rounded-xl w-fit mb-4">
                    <benefit.icon className="w-6 h-6 text-[#c8ff00]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleStartScan}
                className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-lg px-12 py-7 rounded-xl"
              >
                Start Your Lead-Independence Scan
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials - Oxytocin */}
        <section className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-800/50">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real Business Owners Who Escaped the Trap
            </h2>
            <p className="text-gray-400 text-lg">
              Stop being a "Lead Buyer" (victim). Become a "Market Leader" (owner).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#c8ff00] text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t border-gray-800 pt-4">
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">{testimonial.business}</div>
                  <div className="text-[#c8ff00] font-bold mt-2">Saved: {testimonial.saved}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2 }}
            className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Stop the <span className="text-red-400">Lead Heist</span> Today
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Run your free AI scan and see exactly how much revenue Thumbtack, Angi, and predatory agencies are stealing from you right now.
            </p>
            <Button
              onClick={handleStartScan}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-xl px-16 py-8 rounded-xl shadow-[0_0_60px_rgba(200,255,0,0.4)] hover:scale-105 transition-all"
            >
              <Zap className="w-6 h-6 mr-3" />
              Start My 60-Second Scan
            </Button>
            <p className="text-gray-600 text-sm mt-4">
              Free forever • No credit card required • Instant results
            </p>
          </motion.div>
        </section>
      </div>

      <LegalFooter />
    </div>
  );
}