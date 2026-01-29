import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

export default function ExpandableAuditSection({ 
  id, 
  title, 
  icon: Icon, 
  defaultExpanded = false,
  children,
  gradient = 'from-gray-900 to-gray-800',
  accentColor = '[#c8ff00]',
  isLoading = false,
  hasError = false,
  onRetry = null,
  isEmpty = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded]);

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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin" />
                      <span className="ml-3 text-gray-400">Loading analysis...</span>
                    </div>
                  ) : hasError ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h4 className="text-white font-bold text-lg mb-2">Analysis Failed</h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Unable to load this section. Please try again.
                      </p>
                      {onRetry && (
                        <Button
                          onClick={onRetry}
                          className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
                        >
                          Retry Analysis
                        </Button>
                      )}
                    </div>
                  ) : isEmpty ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📊</div>
                      <h4 className="text-white font-bold text-lg mb-2">No Data Available</h4>
                      <p className="text-gray-400 text-sm">
                        This analysis section is not available yet.
                      </p>
                    </div>
                  ) : (
                    children
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}