import React from 'react';
import { Shield, Zap, Award, Users, Star, Lock } from 'lucide-react';

const badges = [
  { icon: Shield, text: 'SSL Secure', color: 'text-green-400' },
  { icon: Zap, text: '60 Sec Results', color: 'text-blue-400' },
  { icon: Award, text: 'Trusted by 5000+', color: 'text-purple-400' },
  { icon: Users, text: 'No Credit Card', color: 'text-orange-400' },
  { icon: Star, text: '4.9/5 Rating', color: 'text-yellow-400' },
  { icon: Lock, text: 'GDPR Compliant', color: 'text-cyan-400' }
];

export default function TrustBadges({ variant = 'horizontal', showAll = false }) {
  const displayBadges = showAll ? badges : badges.slice(0, 4);

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayBadges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-4 bg-gray-900/50 border border-gray-800 rounded-lg backdrop-blur-sm hover:border-[#c8ff00]/30 transition-colors"
            >
              <Icon className={`w-6 h-6 ${badge.color}`} />
              <span className="text-xs text-gray-400 text-center">{badge.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {displayBadges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full backdrop-blur-sm"
          >
            <Icon className={`w-4 h-4 ${badge.color}`} />
            <span className="text-xs text-gray-300">{badge.text}</span>
          </div>
        );
      })}
    </div>
  );
}