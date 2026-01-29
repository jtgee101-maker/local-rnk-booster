import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableAuditSection({ 
  id, 
  title, 
  icon: Icon, 
  defaultExpanded = false,
  children,
  gradient = 'from-gray-900 to-gray-800',
  accentColor = '[#c8ff00]'
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      id={`section-${id}`}
    >
      <Card className={`bg-gradient-to-br ${gradient} border-2 border-gray-700/50 overflow-hidden`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-800/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${accentColor}/10 border-2 border-${accentColor}/30`}>
              <Icon className={`w-7 h-7 text-${accentColor}`} />
            </div>
            <div className="text-left">
              <h3 className="text-white text-xl font-black">{title}</h3>
              <p className="text-gray-400 text-sm">
                {isExpanded ? 'Click to collapse details' : 'Click to view full analysis'}
              </p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? (
              <ChevronUp className={`w-6 h-6 text-${accentColor}`} />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0 pb-6 px-6">
                <div className="border-t border-gray-700/50 pt-6">
                  {children}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}