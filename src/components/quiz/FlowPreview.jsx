import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Quick Questions',
    description: 'Tell us about your business',
    duration: '30 sec'
  },
  {
    number: '2',
    title: 'AI Analysis',
    description: 'We scan your GMB profile',
    duration: '30 sec'
  },
  {
    number: '3',
    title: 'Custom Report',
    description: 'Get your ranking strategy',
    duration: 'Instant'
  }
];

export default function FlowPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="mt-16 max-w-3xl mx-auto"
    >
      <h3 className="text-white font-bold text-xl mb-8 text-center">
        Here's What Happens Next:
      </h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + index * 0.1 }}
            className="relative"
          >
            {/* Connector Arrow */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 -right-3 z-10">
                <ArrowRight className="w-6 h-6 text-[#c8ff00]" />
              </div>
            )}
            
            {/* Step Card */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-[#c8ff00]/50 transition-colors">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#c8ff00] flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-lg">{step.number}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">{step.title}</h4>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-500 text-xs">{step.duration}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center text-gray-500 text-sm mt-6"
      >
        💡 <span className="text-gray-400">Total time: Less than 90 seconds to transformation</span>
      </motion.p>
    </motion.div>
  );
}