import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, DollarSign, TrendingUp, Eye, MousePointer, Clock } from 'lucide-react';

export default function RealTimeAnalytics() {
  const [liveData, setLiveData] = useState({
    activeUsers: 0,
    todayLeads: 0,
    todayRevenue: 0,
    conversionRate: 0,
    recentEvents: []
  });

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        // Get real-time metrics
        const today = new Date().toISOString().split('T')[0];
        
        const [leads, orders, events, behaviors] = await Promise.all([
          base44.entities.Lead.filter({ 
            created_date: { $gte: `${today}T00:00:00Z` } 
          }),
          base44.entities.Order.filter({ 
            created_date: { $gte: `${today}T00:00:00Z` } 
          }),
          base44.entities.ConversionEvent.list('-created_date', 10),
          base44.entities.UserBehavior.filter({
            last_visit: { $gte: new Date(Date.now() - 15 * 60 * 1000).toISOString() }
          })
        ]);

        const todayRevenue = orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const conversionRate = leads.length > 0 
          ? ((orders.length / leads.length) * 100).toFixed(1) 
          : 0;

        setLiveData({
          activeUsers: behaviors.length,
          todayLeads: leads.length,
          todayRevenue,
          conversionRate,
          recentEvents: events
        });
      } catch (error) {
        console.error('Failed to fetch live data:', error);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{liveData.activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Last 15 minutes</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Today's Leads</CardTitle>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{liveData.todayLeads}</div>
            <p className="text-xs text-gray-500 mt-1">Since midnight</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Today's Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              ${liveData.todayRevenue.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{liveData.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Lead to order</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Stream */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Live Activity Stream</CardTitle>
            <Badge className="bg-green-500 animate-pulse">LIVE</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {liveData.recentEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              liveData.recentEvents.map((event, idx) => (
                <div
                  key={event.id || idx}
                  className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {event.event_name?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {event.funnel_version} • {new Date(event.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                  {event.properties?.business_name && (
                    <Badge variant="outline" className="text-xs">
                      {event.properties.business_name}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}