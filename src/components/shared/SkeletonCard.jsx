import React from 'react';
import { Card } from '@/components/ui/card';

export default function SkeletonCard({ variant = 'default' }) {
  if (variant === 'testimonial') {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-32" />
              <div className="h-3 bg-gray-800 rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-800 rounded w-4/6" />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'metric') {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-800 rounded w-32" />
            <div className="w-10 h-10 bg-gray-800 rounded-lg" />
          </div>
          <div className="h-8 bg-gray-800 rounded w-24" />
          <div className="h-3 bg-gray-800 rounded w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-800 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-5/6" />
          <div className="h-4 bg-gray-800 rounded w-4/6" />
        </div>
      </div>
    </Card>
  );
}