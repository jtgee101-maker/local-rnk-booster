import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';

/**
 * Revenue attribution dashboard
 * Tracks which sources/funnels drive the most revenue
 */
export default function RevenueAttribution() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orders, leads] = await Promise.all([
        base44.entities.Order.filter({ status: 'completed' }),
        base44.entities.Lead.list()
      ]);

      // Attribution by funnel version
      const v2Revenue = orders
        .filter(o => o.metadata?.funnel_version === 'v2')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const v3Revenue = orders
        .filter(o => o.metadata?.funnel_version === 'v3')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Attribution by lead source
      const sourceAttribution = {};
      for (const order of orders) {
        const lead = leads.find(l => l.email === order.email);
        const source = lead?.lead_source || 'unknown';
        sourceAttribution[source] = (sourceAttribution[source] || 0) + (order.total_amount || 0);
      }

      // Attribution by first touch
      const firstTouchAttribution = {};
      for (const order of orders) {
        const lead = leads.find(l => l.email === order.email);
        const events = await base44.entities.ConversionEvent.filter({ lead_id: lead?.id });
        const firstEvent = events.sort((a, b) => 
          new Date(a.created_date) - new Date(b.created_date)
        )[0];
        
        const touchpoint = firstEvent?.event_name || 'direct';
        firstTouchAttribution[touchpoint] = (firstTouchAttribution[touchpoint] || 0) + (order.total_amount || 0);
      }

      // Calculate conversion rates
      const v2Leads = leads.filter(l => l.admin_notes?.includes('V2'));
      const v2Conversions = orders.filter(o => o.metadata?.funnel_version === 'v2').length;
      const v2ConversionRate = v2Leads.length > 0 ? (v2Conversions / v2Leads.length * 100).toFixed(1) : 0;

      const v3Leads = leads.filter(l => l.admin_notes?.includes('V3'));
      const v3Conversions = orders.filter(o => o.metadata?.funnel_version === 'v3').length;
      const v3ConversionRate = v3Leads.length > 0 ? (v3Conversions / v3Leads.length * 100).toFixed(1) : 0;

      setData({
        funnelAttribution: {
          v2: { revenue: v2Revenue, conversions: v2Conversions, rate: v2ConversionRate },
          v3: { revenue: v3Revenue, conversions: v3Conversions, rate: v3ConversionRate }
        },
        sourceAttribution,
        firstTouchAttribution,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? 
          orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length : 0
      });
    } catch (error) {
      console.error('Revenue attribution error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading attribution data...</div>;
  }

  if (!data) {
    return <div className="text-gray-400">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${data.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${data.avgOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Comparison */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Funnel Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#c8ff00]/5 border border-[#c8ff00]/30 rounded-lg">
              <div>
                <div className="text-sm text-gray-400">V2 (Stripe)</div>
                <div className="text-2xl font-bold text-[#c8ff00]">
                  ${data.funnelAttribution.v2.revenue.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Conversion Rate</div>
                <div className="text-xl font-bold text-white">
                  {data.funnelAttribution.v2.rate}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div>
                <div className="text-sm text-gray-400">V3 (Affiliate)</div>
                <div className="text-2xl font-bold text-green-400">
                  ${data.funnelAttribution.v3.revenue.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Conversion Rate</div>
                <div className="text-xl font-bold text-white">
                  {data.funnelAttribution.v3.rate}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Attribution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue by Lead Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.sourceAttribution)
              .sort((a, b) => b[1] - a[1])
              .map(([source, revenue]) => (
                <div key={source} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-300 capitalize">{source}</span>
                  <span className="text-white font-bold">${revenue.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* First Touch Attribution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">First Touch Attribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.firstTouchAttribution)
              .sort((a, b) => b[1] - a[1])
              .map(([touchpoint, revenue]) => (
                <div key={touchpoint} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                  <span className="text-gray-300">{touchpoint}</span>
                  <span className="text-white font-bold">${revenue.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}