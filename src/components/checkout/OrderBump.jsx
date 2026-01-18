import React from 'react';
import { motion } from 'framer-motion';
import { Check, Camera, TrendingUp } from 'lucide-react';

const bumps = {
  photos: {
    icon: Camera,
    title: 'Add 5 Professional Geo-Tagged Photos',
    description: 'Stand out in search results with stunning, location-optimized images that boost your profile visibility by up to 42%',
    price: 49,
    features: [
      'Professional photographer in your area',
      'GPS-tagged for local SEO boost',
      'Optimized for Google ranking algorithm',
      'Delivered within 7 days'
    ]
  }
};

export default function OrderBump({ type = 'photos', selected, onToggle }) {
  const bump = bumps[type];
  const Icon = bump.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative border-2 rounded-2xl p-6 transition-all cursor-pointer ${
        selected 
          ? 'border-[#c8ff00] bg-[#c8ff00]/5' 
          : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
      }`}
      onClick={onToggle}
    >
      {/* Popular Badge */}
      <div className="absolute -top-3 left-6">
        <div className="bg-[#c8ff00] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          MOST POPULAR
        </div>
      </div>

      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            selected 
              ? 'bg-[#c8ff00] border-[#c8ff00]' 
              : 'border-gray-600'
          }`}>
            {selected && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selected ? 'bg-[#c8ff00]/20' : 'bg-gray-800'}`}>
                <Icon className={`w-5 h-5 ${selected ? 'text-[#c8ff00]' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{bump.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{bump.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold text-[#c8ff00]">+${bump.price}</div>
              <div className="text-xs text-gray-500">one-time</div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 pl-11">
            {bump.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-1 h-1 rounded-full ${selected ? 'bg-[#c8ff00]' : 'bg-gray-600'}`} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}