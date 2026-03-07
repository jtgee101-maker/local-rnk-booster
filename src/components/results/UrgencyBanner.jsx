import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight } from 'lucide-react';

export default function UrgencyBanner({ healthScore, businessName, onContinue }) {
  const [spotsLeft] = useState(() => Math.floor(Math.random() * 4) + 3); // 3–6
  const [viewers] = useState(() => Math.floor(Math.random() * 8) + 12); // 12–19
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <Clock className="w-4 h-4" />
          {mins}:{secs} on this report
        </span>
        <span className="flex items-center gap-1.5 text-orange-300 font-semibold">
          <Users className="w-4 h-4" />
          {viewers} others viewing pathways right now
        </span>
        <span className="text-red-300 font-bold">
          Only {spotsLeft} onboarding spots left this week
        </span>
      </div>
      <motion.button
        onClick={onContinue}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm transition-all"
      >
        Claim My Pathway <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}