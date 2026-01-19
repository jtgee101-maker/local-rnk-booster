import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, CheckCircle2, Award, Shield } from 'lucide-react';

export default function ContactInfoStep({ onSubmit, businessName }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Valid email required';
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Valid phone required';
    }
    if (!consent) {
      newErrors.consent = 'Please accept terms to continue';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ email, phone, consent });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto px-4 text-center"
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
        className="text-3xl md:text-4xl font-bold text-white mb-2"
      >
        Congratulations!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-lg mb-8"
      >
        Complete your profile to receive your personalized GMB audit report
      </motion.p>

      {/* Contact Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onSubmit={handleSubmit}
        className="mb-8 space-y-4"
      >
        {/* Email Input */}
        <div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`w-full pl-12 pr-4 py-6 text-lg bg-gray-900 border rounded-xl focus:ring-[#c8ff00] ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-[#c8ff00]'
              }`}
            />
          </div>
          {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
        </div>

        {/* Phone Input */}
        <div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={`w-full pl-12 pr-4 py-6 text-lg bg-gray-900 border rounded-xl focus:ring-[#c8ff00] ${
                errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-[#c8ff00]'
              }`}
            />
          </div>
          {errors.phone && <p className="text-red-400 text-sm mt-2">{errors.phone}</p>}
        </div>

        {/* Consent Checkbox */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.consent) setErrors({ ...errors, consent: '' });
              }}
              className="w-5 h-5 rounded accent-[#c8ff00] mt-1 flex-shrink-0"
            />
            <span className="text-gray-300 text-sm">
              I consent to receive my GMB audit report and occasional updates about improving my local visibility. I can unsubscribe anytime.
            </span>
          </label>
          {errors.consent && <p className="text-red-400 text-sm mt-2">{errors.consent}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
        >
          Get My Free Audit Report
        </Button>

        <p className="text-xs text-gray-600">
          Your information is secure and will never be shared
        </p>
      </motion.form>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4 text-[#c8ff00]" />
          <span>Your data is encrypted and secure</span>
        </div>
      </motion.div>
    </motion.div>
  );
}