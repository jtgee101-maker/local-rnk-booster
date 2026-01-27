import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star, TrendingUp, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

/**
 * Reusable Industry Landing Page Template
 * Pass config object with industry-specific content
 */
export default function IndustryLandingTemplate({ config }) {
  React.useEffect(() => {
    const trackView = async () => {
      try {
        await base44.analytics.track({ 
          eventName: `${config.industry}_landing_viewed` 
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }
    };
    trackView();
  }, [config.industry]);

  const handleCTA = () => {
    base44.analytics.track({ 
      eventName: `${config.industry}_cta_clicked` 
    }).catch(() => {});
    window.location.href = createPageUrl('QuizGeenius');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <MobileOptimizations />
      <MobileViewportFix />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,90vw)] h-[800px] bg-gradient-to-b ${config.accentGradient} rounded-full blur-[80px] md:blur-[150px] opacity-40`} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Industry Badge */}
            <div className={`inline-flex items-center gap-2 ${config.badgeBg} border ${config.badgeBorder} rounded-full px-4 py-2 mb-6`}>
              {config.badgeIcon && <config.badgeIcon className={`w-4 h-4 ${config.badgeColor}`} />}
              <span className={`${config.badgeColor} font-semibold text-sm`}>{config.badgeText}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {config.headline}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] to-green-400">
                {config.headlineHighlight}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              {config.subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={handleCTA}
                size="lg"
                className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-gray-900 font-bold px-8 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 active:scale-95 min-h-[56px] md:min-h-[64px] touch-manipulation"
              >
                <Zap className="w-5 h-5 mr-2" />
                {config.ctaText}
              </Button>
              <Button
                onClick={handleCTA}
                size="lg"
                variant="outline"
                className="border-2 border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00]/10 px-8 md:px-12 py-6 md:py-8 text-lg font-bold min-h-[56px] md:min-h-[64px] touch-manipulation"
              >
                {config.secondaryCTA}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {config.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="text-3xl md:text-4xl font-bold text-[#c8ff00] mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Pain Points Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
              Why You're Losing <span className={config.accentText}>${config.monthlyLoss}+/Month</span>
            </h2>
            <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              {config.painPointsIntro}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {config.painPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`${point.bgColor} border-2 ${point.borderColor} rounded-xl p-6 flex items-start gap-4 hover:shadow-lg transition-shadow`}
                >
                  <point.icon className={`w-6 h-6 ${point.iconColor} flex-shrink-0 mt-1`} />
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{point.title}</h3>
                    <p className={`${point.textColor} text-sm font-medium`}>→ {point.impact}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-gradient-to-br from-white/5 to-[#c8ff00]/5 rounded-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
              What You'll Discover in Your Free Audit
            </h2>
            <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              {config.benefitsIntro}
            </p>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {config.benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Social Proof */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h3 className="text-2xl md:text-4xl font-bold text-white text-center mb-12">
            Real {config.industry}, Real Results
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {config.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-lg">"{testimonial.text}"</p>
                <div>
                  <p className="text-white font-bold text-sm">{testimonial.author}</p>
                  <p className="text-gray-500 text-xs">{testimonial.business}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#c8ff00] to-green-400 rounded-3xl p-8 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {config.finalCTAHeadline}
            </h2>
            <p className="text-lg md:text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
              {config.finalCTASubtext}
            </p>
            <Button
              onClick={handleCTA}
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-12 py-8 font-bold min-h-[56px] md:min-h-[64px] touch-manipulation transform hover:scale-105 active:scale-95 transition-transform"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Claim My Free {config.industry} Audit
            </Button>
            <p className="text-sm text-gray-700 mt-6 font-semibold">
              ✓ No credit card required  •  ✓ Instant results  •  ✓ 100% free
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4">
          <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
            <p>© 2026 LocalRank.ai. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}