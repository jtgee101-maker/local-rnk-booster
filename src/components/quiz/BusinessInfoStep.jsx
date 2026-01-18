import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Globe, Mail, ArrowRight } from 'lucide-react';

export default function BusinessInfoStep({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    business_name: '',
    website: '',
    email: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.business_name.trim()) newErrors.business_name = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto px-4"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Almost there! Tell us about your business
        </h2>
        <p className="text-gray-400">
          So our AI can run the scan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Business Name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="pl-12 py-6 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 rounded-xl focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20"
            />
          </div>
          {errors.business_name && (
            <p className="text-red-400 text-sm mt-1">{errors.business_name}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Website URL (optional)"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="pl-12 py-6 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 rounded-xl focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-12 py-6 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 rounded-xl focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20"
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
          >
            Run My Free Audit
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        <p className="text-gray-600 text-xs text-center">
          Your information is secure and will never be shared.
        </p>
      </form>
    </motion.div>
  );
}