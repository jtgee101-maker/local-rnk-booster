import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin } from 'lucide-react';

const notifications = [
  { name: "Elite Plumbing & Drain", location: "Austin, TX", action: "discovered $12,400/mo revenue leak", time: "Just now" },
  { name: "Bright Smile Dental Care", location: "Seattle, WA", action: "found 18 geographic blind spots", time: "2 min ago" },
  { name: "ProTemp HVAC Solutions", location: "Phoenix, AZ", action: "completed free Foxy audit", time: "3 min ago" },
  { name: "Summit Roofing & Construction", location: "Denver, CO", action: "discovered $9,800/mo in lost calls", time: "5 min ago" },
  { name: "Reliable Electric Services", location: "Portland, OR", action: "found 23 ranking opportunities", time: "7 min ago" },
  { name: "Total Care Chiropractic", location: "San Diego, CA", action: "completed visibility audit", time: "9 min ago" },
  { name: "Premier Auto Repair Shop", location: "Miami, FL", action: "discovered 14 weak zones", time: "11 min ago" },
  { name: "GreenScape Landscaping Co", location: "Charlotte, NC", action: "found $6,200/mo revenue leak", time: "13 min ago" },
  { name: "Family Dental Practice", location: "Nashville, TN", action: "started free Foxy audit", time: "15 min ago" },
  { name: "All-Pro Contractors LLC", location: "Boston, MA", action: "discovered 21 visibility gaps", time: "18 min ago" },
  { name: "Cool Breeze Air Conditioning", location: "Houston, TX", action: "completed GMB health check", time: "20 min ago" },
  { name: "Master Plumbing Experts", location: "Atlanta, GA", action: "found $15,300/mo in lost leads", time: "22 min ago" },
  { name: "Perfect Smile Orthodontics", location: "Tampa, FL", action: "discovered 19 ranking issues", time: "25 min ago" },
  { name: "Superior Roofing Services", location: "Dallas, TX", action: "completed free audit", time: "28 min ago" },
  { name: "Quality Auto Body & Paint", location: "Chicago, IL", action: "found $7,900/mo revenue leak", time: "30 min ago" },
  { name: "ABC Lawn Care Services", location: "Orlando, FL", action: "discovered 16 visibility issues", time: "32 min ago" },
  { name: "Professional Handyman Co", location: "Philadelphia, PA", action: "completed Foxy audit", time: "35 min ago" },
  { name: "Downtown Legal Associates", location: "San Francisco, CA", action: "found $11,200/mo opportunity", time: "38 min ago" },
  { name: "The Gourmet Kitchen", location: "New York, NY", action: "discovered 25 weak zones", time: "40 min ago" },
  { name: "Elite Property Management", location: "Las Vegas, NV", action: "completed GMB audit", time: "43 min ago" }
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