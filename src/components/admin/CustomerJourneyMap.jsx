import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  MousePointer, Mail, DollarSign, CheckCircle, XCircle, 
  Clock, MapPin, ExternalLink, ArrowRight 
} from 'lucide-react';

export default function CustomerJourneyMap({ leadId }) {
  const { data: journey, isLoading } = useQuery({
    queryKey: ['journey', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      // Fetch lead, events, emails, orders
      const [lead, events, emails, orders] = await Promise.all([
        base44.entities.Lead.get(leadId),
        base44.entities.ConversionEvent.filter({ lead_id: leadId }),
        base44.entities.EmailLog.filter({ metadata: { lead_id: leadId } }),
        base44.entities.Order.filter({ lead_id: leadId })
      ]);

      // Combine and sort by date
      const timeline = [
        ...events.map(e => ({ type: 'event', data: e, date: e.created_date })),
        ...emails.map(e => ({ type: 'email', data: e, date: e.created_date })),
        ...orders.map(o => ({ type: 'order', data: o, date: o.created_date }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      return { lead, timeline };
    },
    enabled: !!leadId
  });

  const getEventIcon = (item) => {
    switch (item.type) {
      case 'event': return <MousePointer className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'order': return <DollarSign className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (item) => {
    if (item.type === 'order') return 'bg-green-500';
    if (item.type === 'email' && item.data.status === 'opened') return 'bg-blue-500';
    if (item.type === 'event' && item.data.event_name === 'quiz_completed') return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getEventTitle = (item) => {
    if (item.type === 'event') return item.data.event_name.replace(/_/g, ' ');
    if (item.type === 'email') return `Email: ${item.data.subject || item.data.type}`;
    if (item.type === 'order') return `Order - $${item.data.total_amount}`;
    return 'Unknown';
  };

  if (!leadId) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Select a lead to view their journey
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Loading journey...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#c8ff00]" />
          Customer Journey: {journey?.lead?.business_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {journey?.timeline.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No activity recorded yet</div>
          ) : (
            journey?.timeline.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`${getEventColor(item)} p-2 rounded-full text-white`}>
                    {getEventIcon(item)}
                  </div>
                  {i < journey.timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-700 my-1" />
                  )}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white font-medium capitalize">
                      {getEventTitle(item)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(item.date).toLocaleString()}
                    </div>
                  </div>
                  
                  {item.type === 'email' && (
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.data.status}
                      </Badge>
                      {item.data.open_count > 0 && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                          Opened {item.data.open_count}x
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {item.type === 'event' && item.data.properties && (
                    <div className="text-xs text-gray-400 mt-1">
                      {Object.entries(item.data.properties).slice(0, 3).map(([k, v]) => (
                        <div key={k}>{k}: {JSON.stringify(v)}</div>
                      ))}
                    </div>
                  )}
                  
                  {item.type === 'order' && (
                    <Badge className={
                      item.data.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      item.data.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {item.data.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}