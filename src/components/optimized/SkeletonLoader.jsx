import React from 'react';
import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
      <div className="space-y-2">
        <div className="h-2 bg-gray-800 rounded animate-pulse" />
        <div className="h-2 bg-gray-800 rounded animate-pulse w-5/6" />
        <div className="h-2 bg-gray-800 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonPricingCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 space-y-6"
    >
      <div className="space-y-3">
        <div className="h-6 bg-gray-800 rounded animate-pulse w-1/2" />
        <div className="h-12 bg-gray-800 rounded animate-pulse w-3/4" />
      </div>
      
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-800 rounded-full animate-pulse" />
            <div className="h-3 bg-gray-800 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
      
      <div className="h-14 bg-gray-800 rounded-xl animate-pulse" />
    </motion.div>
  );
}

export function SkeletonTestimonial() {
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-800 rounded animate-pulse" />
        <div className="h-3 bg-gray-800 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-gray-800 rounded animate-pulse w-4/6" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse" />
        <div className="space-y-1 flex-1">
          <div className="h-2 bg-gray-800 rounded animate-pulse w-1/3" />
          <div className="h-2 bg-gray-800 rounded animate-pulse w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-gray-800">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded animate-pulse flex-1" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-3 bg-gray-800 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const components = {
    card: SkeletonCard,
    pricing: SkeletonPricingCard,
    testimonial: SkeletonTestimonial,
    table: SkeletonTable
  };

  const Component = components[type] || SkeletonCard;

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}