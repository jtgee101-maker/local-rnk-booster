import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, TrendingUp, Target, RefreshCw, Zap } from 'lucide-react';

export default function PredictiveAnalytics() {
  const { data: leadQuality, isLoading: loadingQuality, refetch: refetchQuality } = useQuery({
    queryKey: ['lead-quality-prediction'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/predictLeadQuality', { batch_mode: true });
      return response.data;
    },
    staleTime: 10 * 60 * 1000
  });

  const { data: churnRisk, isLoading: loadingChurn, refetch: refetchChurn } = useQuery({
    queryKey: ['churn-prediction'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/predictChurnRisk', {});
      return response.data;
    },
    staleTime: 10 * 60 * 1000
  });

  const { data: revenueForecast, isLoading: loadingForecast, refetch: refetchForecast } = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/forecastRevenue', { period: 'monthly' });
      return response.data;
    },
    staleTime: 10 * 60 * 1000
  });

  const isLoading = loadingQuality || loadingChurn || loadingForecast;

  const hotLeads = leadQuality?.leads?.filter(l => l.priority === 'Hot') || [];
  const warmLeads = leadQuality?.leads?.filter(l => l.priority === 'Warm') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Predictive Analytics & Lead Intelligence
          </h2>
          <p className="text-gray-400 mt-1">ML-powered insights for revenue optimization</p>
        </div>
        <Button 
          onClick={() => {
            refetchQuality();
            refetchChurn();
            refetchForecast();
          }}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-300">Hot Leads</div>
                <div className="text-3xl font-bold text-white">{hotLeads.length}</div>
                <div className="text-xs text-purple-400 mt-1">75+ score</div>
              </div>
              <Zap className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-700/10 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-300">At Risk</div>
                <div className="text-3xl font-bold text-white">{churnRisk?.at_risk_count || 0}</div>
                <div className="text-xs text-orange-400 mt-1">Need attention</div>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-green-700/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300">Revenue Forecast</div>
                <div className="text-3xl font-bold text-white">
                  ${Math.round((revenueForecast?.forecast?.expected_revenue || 0) / 1000)}k
                </div>
                <div className="text-xs text-green-400 mt-1">Next 30 days</div>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-300">Conversion Rate</div>
                <div className="text-3xl font-bold text-white">
                  {revenueForecast?.historical?.conversion_rate || 0}%
                </div>
                <div className="text-xs text-blue-400 mt-1">Last 90 days</div>
              </div>
              <Target className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Views */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="leads">Lead Scoring ({leadQuality?.leads?.length || 0})</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk ({churnRisk?.at_risk_count || 0})</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
        </TabsList>

        {/* Lead Scoring Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Lead Quality Scores</CardTitle>
              <p className="text-sm text-gray-400">ML-powered conversion probability ranking</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadQuality?.leads?.slice(0, 20).map((lead, idx) => (
                  <div key={lead.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">{lead.business_name}</span>
                          <Badge className={
                            lead.priority === 'Hot' ? 'bg-red-500' :
                            lead.priority === 'Warm' ? 'bg-orange-500' :
                            lead.priority === 'Medium' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }>
                            {lead.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">{lead.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#c8ff00]">{lead.score}</div>
                        <div className="text-xs text-gray-400">{lead.conversion_probability}% likely</div>
                      </div>
                    </div>

                    {/* Score Factors */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      {lead.factors?.map((factor, fidx) => (
                        <div key={fidx} className="bg-gray-700/50 rounded p-2">
                          <div className="text-xs text-gray-400">{factor.name}</div>
                          <div className="text-sm text-white font-semibold">
                            {factor.points}/{factor.max}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {lead.recommendations?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 font-semibold">Recommended Actions:</div>
                        {lead.recommendations.map((rec, ridx) => (
                          <div key={ridx} className={`text-xs p-2 rounded ${
                            rec.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                            rec.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            <strong>{rec.action}:</strong> {rec.detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Churn Risk Analysis</CardTitle>
              <p className="text-sm text-gray-400">
                {churnRisk?.at_risk_count || 0} of {churnRisk?.total_customers || 0} customers at risk
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {churnRisk?.customers?.map((customer, idx) => (
                  <div key={customer.lead_id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">{customer.business_name}</div>
                        <div className="text-sm text-gray-400">{customer.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {customer.days_since_purchase} days since purchase • ${customer.order_value} LTV
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          customer.risk_level === 'Critical' ? 'bg-red-500' :
                          customer.risk_level === 'High' ? 'bg-orange-500' :
                          customer.risk_level === 'Medium' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }>
                          {customer.risk_level} Risk
                        </Badge>
                        <div className="text-sm text-gray-400 mt-1">
                          {customer.churn_probability}% churn risk
                        </div>
                      </div>
                    </div>

                    {/* Risk Signals */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 font-semibold">Risk Signals:</div>
                      {customer.signals?.map((signal, sidx) => (
                        <div key={sidx} className={`text-xs p-2 rounded ${
                          signal.severity === 'critical' ? 'bg-red-500/20 text-red-300 border-l-2 border-red-500' :
                          signal.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border-l-2 border-orange-500' :
                          'bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-500'
                        }`}>
                          <div className="font-semibold">{signal.signal}</div>
                          <div className="text-gray-400 mt-1">→ {signal.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">30-Day Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Expected Revenue</div>
                  <div className="text-3xl font-bold text-[#c8ff00]">
                    ${revenueForecast?.forecast?.expected_revenue?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Confidence Range</div>
                  <div className="text-lg text-white">
                    ${revenueForecast?.forecast?.confidence_range?.low?.toLocaleString()} - 
                    ${revenueForecast?.forecast?.confidence_range?.high?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Expected Conversions</div>
                  <div className="text-3xl font-bold text-white">
                    {revenueForecast?.forecast?.expected_conversions}
                  </div>
                </div>
              </div>

              {/* Historical Performance */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h4 className="text-white font-semibold mb-3">Historical Performance (90 Days)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Revenue</div>
                    <div className="text-lg font-bold text-white">
                      ${revenueForecast?.historical?.revenue_90d?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Orders</div>
                    <div className="text-lg font-bold text-white">
                      {revenueForecast?.historical?.orders_90d}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Conv Rate</div>
                    <div className="text-lg font-bold text-white">
                      {revenueForecast?.historical?.conversion_rate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Growth</div>
                    <div className={`text-lg font-bold ${
                      revenueForecast?.historical?.growth_rate_30d >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {revenueForecast?.historical?.growth_rate_30d > 0 ? '+' : ''}
                      {revenueForecast?.historical?.growth_rate_30d}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Opportunities */}
              <div>
                <h4 className="text-white font-semibold mb-3">Top 10 Opportunities</h4>
                <div className="space-y-2">
                  {revenueForecast?.top_opportunities?.map((opp, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{opp.business_name}</div>
                        <div className="text-xs text-gray-400">{opp.conversion_probability}% conversion probability</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#c8ff00] font-bold">${opp.expected_value}</div>
                        <div className="text-xs text-gray-400">Expected value</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}