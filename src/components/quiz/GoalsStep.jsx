import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Users, TrendingUp, MapPin, Star, DollarSign, CheckCircle } from 'lucide-react';

const goals = [
  { id: 'more_calls', label: 'Get More Calls', icon: Phone, desc: 'Direct customer contact' },
  { id: 'increase_footfall', label: 'Increase Foot Traffic', icon: Users, desc: 'More in-store visits' },
  { id: 'rank_higher', label: 'Rank Higher on Maps', icon: TrendingUp, desc: 'Beat competitors' },
  { id: 'expand_area', label: 'Expand Service Area', icon: MapPin, desc: 'Reach more locations' },
  { id: 'more_reviews', label: 'Build Review Reputation', icon: Star, desc: '5-star credibility' },
  { id: 'increase_revenue', label: 'Boost Revenue', icon: DollarSign, desc: 'Higher sales' }
];

export default function GoalsStep({ onContinue }) {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0 && !isSubmitting) {
      setIsSubmitting(true);
      onContinue(selectedGoals);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-4"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-[#c8ff00] font-semibold">STEP 3 OF 5</span>
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          Where Do You Want to Be in <span className="text-[#c8ff00]">30 Days?</span>
        </h2>
        <p className="text-gray-400 text-lg mb-2">
          Select all that apply — your custom strategy will focus here
        </p>
        <p className="text-gray-500 text-sm">
          💡 Most successful businesses pick 2-3 goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8">
        {goals.map((goal, index) => {
          const isSelected = selectedGoals.includes(goal.id);
          const Icon = goal.icon;

          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleGoal(goal.id)}
              className={`relative group border-2 rounded-2xl p-5 md:p-6 text-left transition-all duration-200 min-h-[100px] touch-manipulation ${
                isSelected
                  ? 'border-[#c8ff00] bg-[#c8ff00]/5'
                  : 'border-gray-800 bg-gray-900/30 active:border-gray-700'
              }`}
            >
              {/* Checkmark */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-[#c8ff00] bg-[#c8ff00]'
                  : 'border-gray-600'
              }`}>
                {isSelected && <CheckCircle className="w-4 h-4 text-black" strokeWidth={3} />}
              </div>

              <div className="flex items-start gap-3 md:gap-4 pr-8">
                <div className={`p-2.5 md:p-3 rounded-xl transition-colors ${
                  isSelected ? 'bg-[#c8ff00]/20' : 'bg-gray-800'
                }`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                    isSelected ? 'text-[#c8ff00]' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-base md:text-lg mb-1 transition-colors ${
                    isSelected ? 'text-[#c8ff00]' : 'text-white'
                  }`}>
                    {goal.label}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">{goal.desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={handleContinue}
          disabled={selectedGoals.length === 0 || isSubmitting}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black font-semibold px-12 py-6 text-base md:text-lg rounded-full transition-all duration-200 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] touch-manipulation"
        >
          {isSubmitting ? 'Processing...' : 'Continue'}
        </Button>
        <p className="text-gray-600 text-sm mt-3">
          {selectedGoals.length > 0 ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected` : 'Select at least one goal'}
        </p>
      </motion.div>
    </motion.div>
  );
}