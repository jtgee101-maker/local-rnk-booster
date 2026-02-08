import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Award, Star } from 'lucide-react';

export default function EmailCaptureStep({ onSubmit, businessName }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onSubmit(email);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto px-4 text-center"
    >
      {/* Success Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00] mb-6"
      >
        <Award className="w-10 h-10 text-[#c8ff00]" />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4"
      >
        Congratulations!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-lg mb-8"
      >
        Enter your email to receive your personalized GMB audit report
      </motion.p>

      {/* Email Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onSubmit={handleSubmit}
        className="mb-8"
      >
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-6 text-lg bg-gray-900 border-gray-800 rounded-xl focus:border-[#c8ff00] focus:ring-[#c8ff00]"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
        >
          Continue
        </Button>

        <p className="text-xs text-gray-600 mt-4">
          By continuing, you agree to receive email communications about your audit results
        </p>
      </motion.form>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4" />
          <span>Editor's Choice</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#c8ff00]" />
          <span>Best Mobile App</span>
        </div>
      </motion.div>
    </motion.div>
  );
}