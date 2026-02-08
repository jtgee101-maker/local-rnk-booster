import React, { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Mike Rodriguez",
    business: "Rodriguez Plumbing",
    location: "Austin, TX",
    thumbnail: "🔧",
    result: "+287% Calls",
    rating: 5,
    videoUrl: null,
    quote: "Went from invisible to #1 in my area in just 6 weeks. The geo-heatmap showed me exactly where I was missing customers."
  },
  {
    name: "Sarah Chen",
    business: "Elite Dental Care",
    location: "Seattle, WA",
    thumbnail: "🦷",
    result: "+$12K/mo",
    rating: 5,
    videoUrl: null,
    quote: "Foxy's AI found visibility gaps my previous agency completely missed. ROI was positive in the first month."
  },
  {
    name: "James Wilson",
    business: "Wilson HVAC",
    location: "Phoenix, AZ",
    thumbnail: "❄️",
    result: "+450% ROI",
    rating: 5,
    videoUrl: null,
    quote: "Finally beating the big franchise competitors in my area. The automated GMB posts alone are worth the investment."
  }
];

export default function VideoTestimonial({ variant = 'grid' }) {
  const [playingIndex, setPlayingIndex] = useState(null);

  if (variant === 'single') {
    const testimonial = testimonials[0];
    return (
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700 overflow-hidden">
        <div className="relative aspect-video bg-gray-800 flex items-center justify-center cursor-pointer group">
          <div className="text-8xl">{testimonial.thumbnail}</div>
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 bg-[#c8ff00] rounded-full flex items-center justify-center"
            >
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </motion.div>
          </div>
          <Badge className="absolute top-4 right-4 bg-red-600 text-white">
            {testimonial.result}
          </Badge>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
          <div>
            <div className="text-white font-bold">{testimonial.name}</div>
            <div className="text-gray-400 text-sm">{testimonial.business} • {testimonial.location}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {testimonials.map((testimonial, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-[#c8ff00]/30 transition-colors h-full">
            <div className="relative aspect-video bg-gray-800 flex items-center justify-center cursor-pointer group">
              <div className="text-6xl">{testimonial.thumbnail}</div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 bg-[#c8ff00] rounded-full flex items-center justify-center"
                >
                  <Play className="w-6 h-6 text-gray-900 ml-1" />
                </motion.div>
              </div>
              <Badge className="absolute top-2 right-2 bg-green-600 text-white font-bold">
                {testimonial.result}
              </Badge>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 text-sm italic mb-3 line-clamp-3">"{testimonial.quote}"</p>
              <div>
                <div className="text-white font-bold text-sm">{testimonial.name}</div>
                <div className="text-gray-400 text-xs">{testimonial.business}</div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}