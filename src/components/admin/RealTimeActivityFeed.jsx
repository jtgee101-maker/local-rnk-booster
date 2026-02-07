import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, User, Mail, DollarSign, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RealTimeActivityFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const [activities, setActivities] = useState([]);

  const { data: recentActivity, refetch } = useQuery({
    queryKey: ['realtime-activity'],
    queryFn: async () => {
      const [leads, orders, emails] = await Promise.all([
        base44.entities.Lead.list('-created_date', 5),
        base44.entities.Order.list('-created_date', 5),
        base44.entities.EmailLog.list('-created_date', 5)
      ]);

      return [
        ...leads.map(l => ({ type: 'lead', data: l, timestamp: l.created_date })),
        ...orders.map(o => ({ type: 'order', data: o, timestamp: o.created_date })),
        ...emails.map(e => ({ type: 'email', data: e, timestamp: e.created_date }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    },
    refetchInterval: isPaused ? false : 5000
  });

  useEffect(() => {
    if (recentActivity && !isPaused) {
      setActivities(recentActivity);
    }
  }, [recentActivity, isPaused]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'lead': return <User className="w-4 h-4" />;
      case 'order': return <DollarSign className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (item) => {
    if (item.type === 'order') return 'bg-green-500/20 text-green-400';
    if (item.type === 'lead') return 'bg-blue-500/20 text-blue-400';
    if (item.type === 'email') {
      if (item.data.status === 'failed') return 'bg-red-500/20 text-red-400';
      if (item.data.status === 'opened') return 'bg-purple-500/20 text-purple-400';
      return 'bg-gray-500/20 text-gray-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  const getActivityText = (item) => {
    if (item.type === 'lead') {
      return `New lead: ${item.data.business_name || item.data.email}`;
    }
    if (item.type === 'order') {
      return `Order placed: $${item.data.total_amount} (${item.data.status})`;
    }
    if (item.type === 'email') {
      return `Email ${item.data.status}: ${item.data.type} to ${item.data.to}`;
    }
    return 'Unknown activity';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#c8ff00]" />
            Live Activity Feed
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="gap-2"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {activities.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.data.id}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700"
              >
                <div className={`p-2 rounded-lg ${getActivityColor(item)}`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">
                    {getActivityText(item)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                {item.type === 'order' && item.data.status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {item.type === 'email' && item.data.status === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {!isPaused && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Auto-refreshing every 5 seconds
          </div>
        )}
      </CardContent>
    </Card>
  );
}