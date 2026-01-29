import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin } from 'lucide-react';

const notifications = [
  { name: "Mike R.", location: "Austin, TX", action: "completed audit", time: "2 min ago" },
  { name: "Sarah C.", location: "Seattle, WA", action: "started quiz", time: "4 min ago" },
  { name: "James W.", location: "Phoenix, AZ", action: "completed audit", time: "7 min ago" },
  { name: "Lisa M.", location: "Denver, CO", action: "started quiz", time: "9 min ago" },
  { name: "Tom K.", location: "Portland, OR", action: "completed audit", time: "12 min ago" }
];

export default function SocialProofNotification({ enabled = true }) {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const showInterval = setInterval(() => {
      setIsVisible(true);
      setCurrentNotification(prev => (prev + 1) % notifications.length);
      
      setTimeout(() => setIsVisible(false), 5000);
    }, 15000);

    setTimeout(() => setIsVisible(true), 3000);

    return () => clearInterval(showInterval);
  }, [enabled]);

  if (!enabled) return null;

  const notification = notifications[currentNotification];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="fixed bottom-6 left-6 z-40 max-w-sm"
        >
          <div className="bg-gray-900 border-2 border-[#c8ff00]/50 rounded-xl shadow-2xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#c8ff00] rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-gray-900" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">
                  {notification.name}
                </p>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {notification.location}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  {notification.action} • {notification.time}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}