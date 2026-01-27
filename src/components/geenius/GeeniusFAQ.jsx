import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function GeeniusFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I know which pathway is right for me?",
      answer: "Each pathway is designed for different business needs and situations. The GovTech Grant is perfect if you qualify through your payment processor - it's completely free. The Done For You service is ideal for busy owners who want experts to handle everything. The DIY Software gives you full control with training if you prefer to implement yourself."
    },
    {
      question: "What is the GeeNius GovTech Grant and how do I qualify?",
      answer: "The GovTech Grant is a technology infrastructure program available through select payment processors. Eligibility is determined by your current payment processing setup. We'll check if you qualify - the entire verification process takes 2-3 business days. If approved, you get free infrastructure upgrades including GMB optimization."
    },
    {
      question: "Is the Done For You service really hands-off?",
      answer: "Yes, 100%. Our verified provider handles everything from GMB optimization, review management, photo uploads, to ongoing maintenance. You'll receive weekly progress reports and can focus entirely on running your business while they boost your rankings and visibility."
    },
    {
      question: "What's included in the DIY Software License?",
      answer: "You get full access to our GMB optimization platform with step-by-step training videos, implementation guides, and email support. It's $199/month and perfect for business owners who prefer to implement strategies themselves at their own pace with expert guidance available when needed."
    },
    {
      question: "How quickly will I see results?",
      answer: "Results vary by pathway. The GovTech Grant takes 2-3 business days for approval then implementation begins. Done For You services typically show measurable improvements within 30-45 days. DIY implementation depends on your pace but most see initial results within 60-90 days with consistent effort."
    },
    {
      question: "Can I switch between pathways later?",
      answer: "Yes, you're not locked in. Many businesses start with one pathway and switch as their needs evolve. For example, some start DIY to learn the system, then upgrade to Done For You to save time. Contact support anytime to discuss pathway changes."
    },
    {
      question: "What makes your verified Done For You provider different?",
      answer: "We've hand-picked providers with proven track records in GMB optimization. They're not generic agencies - they specialize exclusively in local search and have successfully improved rankings for hundreds of businesses. You're matched based on your specific industry and health score issues."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "The GovTech Grant has no cost, so there's zero risk. Our Done For You provider offers a 30-day satisfaction guarantee. The DIY Software License includes a 14-day trial period - if it's not right for you within the first 2 weeks, we'll refund your first month."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400">
          Everything you need to know about your pathway options
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-600/50"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
            >
              <span className="text-white font-semibold pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            <div
              className={`transition-all duration-300 ease-in-out ${
                openIndex === index
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="px-6 pb-5 text-gray-300 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Still have questions?{' '}
          <a href="mailto:support@localrank.ai" className="text-purple-400 hover:text-purple-300 underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}