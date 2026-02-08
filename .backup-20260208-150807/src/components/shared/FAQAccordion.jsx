import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

const defaultFaqs = [
  {
    question: "Is this really 100% free?",
    answer: "Yes! The Foxy audit is completely free with no credit card required. We want you to see the exact problems in your GMB profile before making any commitment."
  },
  {
    question: "How long does the audit take?",
    answer: "The entire process takes about 60 seconds. Just answer a few quick questions about your business, and Foxy will analyze 47+ ranking factors instantly."
  },
  {
    question: "What makes Foxy different from other GMB tools?",
    answer: "Most tools show surface metrics. Foxy actually tests your visibility from multiple geographic points, analyzes AI search presence, calculates exact revenue loss, and provides a custom 90-day action plan."
  },
  {
    question: "Will this work for my industry?",
    answer: "If you serve local customers and have a Google Business Profile, yes. We've helped plumbers, dentists, lawyers, contractors, and 100+ other industries dominate their local markets."
  },
  {
    question: "Do I need technical knowledge?",
    answer: "Not at all. Foxy explains everything in plain English and provides step-by-step guidance. No SEO experience needed."
  },
  {
    question: "What happens after I get my audit?",
    answer: "You'll receive a detailed report showing your exact visibility gaps, revenue opportunities, and recommended fixes. You can implement changes yourself or let our team handle it for you."
  }
];

export default function FAQAccordion({ faqs = defaultFaqs, title = "Frequently Asked Questions" }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{title}</h2>
        <p className="text-gray-400 text-lg">
          Everything you need to know about your free Foxy audit
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card
            key={index}
            className="bg-gray-900 border-gray-800 overflow-hidden hover:border-[#c8ff00]/30 transition-colors"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left p-6 flex items-center justify-between gap-4"
            >
              <h3 className="text-white font-bold text-lg pr-4">{faq.question}</h3>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-[#c8ff00]" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-gray-300 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}