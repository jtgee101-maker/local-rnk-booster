import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, ShoppingCart, MapPin } from 'lucide-react';

const notifications = [
  { icon: Users, text: 'Sarah M. from Los Angeles just started their audit', time: 'Just now', color: 'text-green-400' },
  { icon: ShoppingCart, text: 'Mike R. from Chicago completed payment', time: '2 min ago', color: 'text-blue-400' },
  { icon: Eye, text: 'James T. from Miami is viewing pricing', time: '3 min ago', color: 'text-purple-400' },
  { icon: MapPin, text: 'Lisa K. from Phoenix claimed 82% discount', time: '5 min ago', color: 'text-[#c8ff00]' },
  { icon: Users, text: 'David P. from Dallas just started their audit', time: '6 min ago', color: 'text-green-400' },
  { icon: ShoppingCart, text: 'Emma W. from Seattle completed payment', time: '8 min ago', color: 'text-blue-400' },
];

export default function LiveActivityIndicator() {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show first notification after 5 seconds
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentNotification((prev) => (prev + 1) % notifications.length);
        setIsVisible(true);
      }, 500);
    }, 8000); // Show each notification for 8 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  const notification = notifications[currentNotification];
  const Icon = notification.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="fixed bottom-6 left-6 z-50 max-w-sm touch-none pointer-events-none"
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gray-800/50 flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${notification.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-snug mb-1">
                  {notification.text}
                </p>
                <p className="text-gray-500 text-xs">{notification.time}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}