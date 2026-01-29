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

export default function SocialProofNotification({ enabled = true, inline = false }) {
  const [currentNotification, setCurrentNotification] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setCurrentNotification(prev => (prev + 1) % notifications.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const notification = notifications[currentNotification];

  if (inline) {
    return (
      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNotification}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-900 border-2 border-[#c8ff00]/30 rounded-xl shadow-xl p-4"
          >
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
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}