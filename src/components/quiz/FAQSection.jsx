import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How is this different from other GMB tools?",
      answer: "Unlike generic tools that just show data, our AI actively scans 40+ directories, identifies revenue-blocking errors, and provides 1-click fixes. We've processed over 7M audits and know exactly what gets businesses ranked."
    },
    {
      question: "Do I need technical skills to use this?",
      answer: "Absolutely not. Our software does all the heavy lifting. You just answer 5 simple questions about your business, and our AI handles the rest. Most users complete their audit in under 60 seconds."
    },
    {
      question: "How quickly will I see results?",
      answer: "Most businesses see improved visibility within 7-14 days after implementing our recommendations. Some see changes in as little as 48 hours, depending on how critical the issues were."
    },
    {
      question: "Is this really free?",
      answer: "Yes! The GMB health scan and audit report are 100% free. No credit card required. We only charge if you want our team to implement the fixes for you (which most people choose because it's faster)."
    },
    {
      question: "What if I'm already working with an agency?",
      answer: "Perfect! Run the audit to see if they're missing critical ranking factors. Over 60% of businesses discover their agency overlooked 3+ fixable issues costing them thousands in lost revenue."
    },
    {
      question: "Will this work for my industry?",
      answer: "Yes. Our system has been tested across 147 industries including HVAC, legal, medical, retail, restaurants, home services, and more. If you have a Google Business Profile, this works."
    }
  ];

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-2 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
        <p className="text-gray-400 text-sm">Everything you need to know before starting</p>
      </motion.div>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + index * 0.05 }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-left hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                <h3 className="text-white font-semibold text-sm md:text-base">{faq.question}</h3>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </div>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center mt-6"
      >
        <p className="text-gray-500 text-xs">
          Still have questions? Email us at{' '}
          <a href="mailto:support@localrank.ai" className="text-[#c8ff00] hover:underline">
            support@localrank.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}