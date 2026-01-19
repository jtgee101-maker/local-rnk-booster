import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target, AlertCircle, Clock, DollarSign } from 'lucide-react';

export default function V2FAQSection() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
     {
       icon: Target,
       question: 'Will I actually own my leads, or am I just renting visibility again?',
       answer: 'You own every lead that comes directly through your Google My Business profile and local search ranking. Unlike Thumbtack or Angi where they own the customer relationship and sell your lead to 5 competitors, Google Maps leads are exclusively yours. We help you own the Map Pack ranking itself—not the platform.'
     },
     {
       icon: Target,
       question: 'Can I really compete with these big platforms?',
       answer: 'Yes. Thumbtack, HomeAdvisor, and Angi have weak GMB profiles because they focus on lead distribution, not local ranking. A properly optimized local business profile beats their paid ads in the Map Pack 70% of the time. We show you exactly how to own that position.'
     },
     {
       icon: AlertCircle,
       question: 'What if I\'ve already tried optimization and nothing happened?',
       answer: 'Most DIY optimization fails because businesses optimize for the wrong things—photos that don\'t convert, weak service descriptions, poor review management. Our audit identifies the exact 3-5 critical issues destroying your ranking. Our customers see movement in 14 days on average.'
     },
     {
       icon: AlertCircle,
       question: 'Is this another service that takes my money and disappears?',
       answer: 'We make money when you make money. Our pricing is tied to results—not just "monthly management fees." You get 30 days to see measurable movement in calls/leads or we refund you. We also track everything in your dashboard so you see exactly what\'s happening week-by-week.'
     },
     {
       icon: AlertCircle,
       question: 'What happens if Google changes their algorithm?',
       answer: 'Google Map Pack rankings are based on distance, review authority, and profile completeness—not keywords. This is the most stable ranking factor Google has. We\'ve tracked these signals for 5+ years. Algorithm changes don\'t affect Map Pack the way they affect organic search.'
     },
     {
       icon: DollarSign,
       question: 'How much will I actually save by ditching Thumbtack and Angi?',
       answer: 'If you\'re losing 5 leads/week to these platforms at $100/lead = $2,000/month or $24,000/year. Most of our clients recoup their yearly investment in the first month just from leads they stopped losing to Thumbtack. After that, every lead is pure profit.'
     },
     {
       icon: DollarSign,
       question: 'How do I know this won\'t just be another monthly expense?',
       answer: 'This is designed as a one-time investment for permanent ranking ownership. After your optimization, your ranking stays as long as you maintain basic GMB hygiene (quarterly reviews, photos, updates). You\'re not renting ongoing "management"—you own the asset.'
     },
     {
       icon: Clock,
       question: 'How long before I see actual calls coming in?',
       answer: 'Your GMB profile changes go live immediately. You see ranking movement in 7-14 days (Google moves fast for local). First calls typically arrive within 21 days. Full results (stable top-3 ranking) usually arrive in 30-60 days depending on local competition.'
     },
     {
       icon: Clock,
       question: 'What if the local market is too competitive?',
       answer: 'Competition actually makes this more valuable. In competitive markets, Thumbtack charges $150+ per lead because visibility is scarce. When you own the Map Pack ranking, you capture 40-60% of all local searches in your category—worth thousands per month. We analyze your specific market in the audit.'
     },
     {
       icon: AlertCircle,
       question: 'Will Google penalize me for doing this optimization?',
       answer: 'No. We only use Google\'s officially recommended optimization strategies. Everything in your audit is white-hat and follows Google\'s own GMB best practices. The risk is zero—the worst that happens is your ranking stays where it is.'
     }
   ];

  const getBgGradient = () => 'from-[#c8ff00]/5 to-[#c8ff00]/10 border-[#c8ff00]/20';

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Common Questions From Service Owners
        </h2>
        <p className="text-gray-400 text-lg">
          Built specifically for contractors, plumbers, electricians, and agencies tired of paying the "lead tax."
        </p>
      </motion.div>

      {/* FAQ Grid */}
      <div className="space-y-4">
        {faqs.map((faq, index) => {
           const isExpanded = expandedIndex === index;
           const Icon = faq.icon;
           const bgGradient = getBgGradient();

           return (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.05 }}
               className={`bg-gradient-to-r ${bgGradient} border rounded-lg overflow-hidden`}
             >
               <button
                 onClick={() => setExpandedIndex(isExpanded ? null : index)}
                 className="w-full p-6 flex items-start gap-4 hover:bg-white/5 transition-colors text-left group"
               >
                 {/* Icon */}
                 <div className="flex-shrink-0 mt-1">
                   <Icon className="w-6 h-6 text-[#c8ff00] group-hover:scale-110 transition-transform" />
                 </div>

                 {/* Content */}
                 <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between gap-4">
                     <h3 className="text-lg font-semibold text-white group-hover:text-[#c8ff00] transition-colors">
                       {faq.question}
                     </h3>
                     <ChevronDown 
                       className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                         isExpanded ? 'rotate-180' : ''
                       }`}
                     />
                   </div>
                 </div>
               </button>

               {/* Answer */}
               <AnimatePresence>
                 {isExpanded && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     transition={{ duration: 0.3 }}
                     className="border-t border-white/10"
                   >
                     <div className="p-6 bg-black/30">
                       <p className="text-gray-300 leading-relaxed">
                         {faq.answer}
                       </p>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </motion.div>
           );
         })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 p-6 bg-gradient-to-r from-[#c8ff00]/10 to-green-500/10 border border-[#c8ff00]/30 rounded-lg text-center"
      >
        <p className="text-white mb-3">
          <strong>Still have questions?</strong> Your personalized audit will address your specific situation.
        </p>
        <p className="text-gray-400 text-sm">
          Every business has different competitors, markets, and challenges. The audit reveals exactly what's holding you back and what you need to dominate locally.
        </p>
      </motion.div>
    </div>
  );
}