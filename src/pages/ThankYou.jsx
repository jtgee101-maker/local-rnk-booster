import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
  useEffect(() => {
    // Clear session storage
    sessionStorage.removeItem('quizLead');
  }, []);

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

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Welcome to <span className="text-[#c8ff00]">LocalRank.ai</span>!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 mb-12"
          >
            Your order has been confirmed. Here's what happens next:
          </motion.p>

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

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={() => window.open('https://calendly.com', '_blank')}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
            >
              Schedule Your Kickoff Call
              <Calendar className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-gray-600 text-sm mt-12"
          >
            Questions? Email us at <span className="text-[#c8ff00]">support@localrank.ai</span>
          </motion.p>
        </div>
      </div>
    </div>
  );
}