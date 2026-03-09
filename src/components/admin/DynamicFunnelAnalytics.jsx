import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, MousePointer, ExternalLink, Target, Clock, 
  Award, AlertCircle, RefreshCw, Download, Loader2, ArrowUpRight, ArrowDownRight,
  DollarSign, ShoppingCart, BarChart3, PieChart, Calendar, Sparkles
} from 'lucide-react';

const TrendIndicator = ({ value, showArrow = true }) => {
  if (value === 0 || value === null || value === undefined) {
    return <span className="text-gray-500 text-xs">—</span>;
  }
  
  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${colorClass}`}>
      {showArrow && <Icon className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
};

const MetricCard = ({ title, value, icon: Icon, iconColor, trend, subtitle, gradient }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <Card className={`bg-gradient-to-br ${gradient} border-2 shadow-lg hover:shadow-xl transition-shadow`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {trend !== undefined && (
              <div className="mt-1">
                <TrendIndicator value={trend} />
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ProgressBar = ({ label, value, total, color = 'bg-blue-500' }) => {
  const percentage = total > 0 ? ((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default function DynamicFunnelAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [currentMode, setCurrentMode] = useState('loading');

  // Fetch current funnel mode
  const { data: funnelModeSettings } = useQuery({
    queryKey: ['funnel-mode-settings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'funnel_mode' });
      return settings.length > 0 ? settings[0].setting_value.mode : 'geenius';
    },
    staleTime: 60000
  });

  useEffect(() => {
    if (funnelModeSettings) {
      setCurrentMode(funnelModeSettings);
    }
  }, [funnelModeSettings]);

  // Fetch analytics based on mode
  const { data: analytics, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['funnel-analytics', currentMode, timeRange],
    queryFn: async () => {
      if (currentMode === 'v2') {
        const response = await base44.functions.invoke('admin/getV2Analytics', { timeRange });
        return response.data;
      } else if (currentMode === 'v3') {
        const response = await base44.functions.invoke('admin/getV3Analytics', { timeRange });
        return response.data;
      } else {
        const response = await base44.functions.invoke('admin/getGeeniusAnalytics', { timeRange });
        return response.data;
      }
    },
    enabled: currentMode !== 'loading',
    staleTime: 2 * 60 * 1000,
    retry: 2
  });

  const handleExport = () => {
    if (!analytics) return;
    
    const modeLabel = currentMode === 'v2' ? 'V2-Stripe' : currentMode === 'v3' ? 'V3-Affiliate' : 'Geenius';
    const csvData = [
      [`${modeLabel} Funnel Analytics Report`],
      ['Time Range', timeRange],
      ['Generated', new Date().toISOString()],
      '',
      ['Core Metrics', 'Value'],
      ...Object.entries(analytics.metrics || {}).map(([k, v]) => [k, v]),
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modeLabel.toLowerCase()}-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (currentMode === 'loading' || isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00] mx-auto" />
          <div className="text-gray-400">Loading funnel analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/50">
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <div className="text-red-300">Failed to load analytics</div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { metrics = {}, funnel = {}, trends = {}, sessions = {}, exitPoints = [], painPoints = [], categories = [], healthScoreDistribution = {} } = analytics || {};

  // Dynamic title based on mode
  const modeConfig = {
    v2: { 
      title: 'Quiz V2 (Stripe) Analytics', 
      subtitle: 'Direct sales funnel performance',
      color: 'blue'
    },
    v3: { 
      title: 'Quiz V3 (Affiliate) Analytics', 
      subtitle: 'Affiliate funnel performance',
      color: 'green'
    },
    geenius: { 
      title: 'QuizGeenius (3-Pathway) Analytics', 
      subtitle: '3-pathway bridge performance',
      color: 'purple'
    }
  };

  const config = modeConfig[currentMode] || modeConfig.geenius;

  // Render metrics based on mode
  const renderMetrics = () => {
    if (currentMode === 'v2') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Quiz Starts"
            value={metrics.totalStarts?.toLocaleString() || '0'}
            icon={Users}
            iconColor="bg-green-500/20 text-green-400"
            gradient="from-green-500/10 to-green-600/5 border-green-500/30"
            trend={trends.starts}
          />
          <MetricCard
            title="Reached Pricing"
            value={metrics.reachedPricing?.toLocaleString() || '0'}
            icon={DollarSign}
            iconColor="bg-blue-500/20 text-blue-400"
            gradient="from-blue-500/10 to-blue-600/5 border-blue-500/30"
            trend={trends.pricing}
          />
          <MetricCard
            title="Checkout Initiated"
            value={metrics.checkoutInitiated?.toLocaleString() || '0'}
            icon={ShoppingCart}
            iconColor="bg-purple-500/20 text-purple-400"
            gradient="from-purple-500/10 to-purple-600/5 border-purple-500/30"
            trend={trends.checkout}
          />
          <MetricCard
            title="Paid Customers"
            value={metrics.paidCustomers?.toLocaleString() || '0'}
            icon={Award}
            iconColor="bg-[#c8ff00]/20 text-[#c8ff00]"
            gradient="from-[#c8ff00]/10 to-[#c8ff00]/5 border-[#c8ff00]/30"
            trend={trends.customers}
          />
        </div>
      );
    } else if (currentMode === 'v3') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Quiz Starts"
            value={metrics.totalStarts?.toLocaleString() || '0'}
            icon={Users}
            iconColor="bg-green-500/20 text-green-400"
            gradient="from-green-500/10 to-green-600/5 border-green-500/30"
            trend={trends.starts}
          />
          <MetricCard
            title="Completed Audits"
            value={metrics.totalCompletions?.toLocaleString() || '0'}
            icon={Target}
            iconColor="bg-blue-500/20 text-blue-400"
            gradient="from-blue-500/10 to-blue-600/5 border-blue-500/30"
            trend={trends.completions}
          />
          <MetricCard
            title="CTA Clicks"
            value={metrics.totalCTAClicks?.toLocaleString() || '0'}
            icon={MousePointer}
            iconColor="bg-purple-500/20 text-purple-400"
            gradient="from-purple-500/10 to-purple-600/5 border-purple-500/30"
            trend={trends.ctaClicks}
          />
          <MetricCard
            title="Affiliate Redirects"
            value={metrics.totalRedirects?.toLocaleString() || '0'}
            icon={ExternalLink}
            iconColor="bg-[#c8ff00]/20 text-[#c8ff00]"
            gradient="from-[#c8ff00]/10 to-[#c8ff00]/5 border-[#c8ff00]/30"
            trend={trends.redirects}
          />
        </div>
      );
    } else {
      // GeeNius mode
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Quiz Starts"
            value={metrics.totalStarts?.toLocaleString() || '0'}
            icon={Users}
            iconColor="bg-green-500/20 text-green-400"
            gradient="from-green-500/10 to-green-600/5 border-green-500/30"
            trend={trends.starts}
          />
          <MetricCard
            title="Results Viewed"
            value={metrics.resultsViewed?.toLocaleString() || '0'}
            icon={Target}
            iconColor="bg-blue-500/20 text-blue-400"
            gradient="from-blue-500/10 to-blue-600/5 border-blue-500/30"
            trend={trends.results}
          />
          <MetricCard
            title="Pathway Selections"
            value={metrics.pathwaySelections?.toLocaleString() || '0'}
            icon={Sparkles}
            iconColor="bg-purple-500/20 text-purple-400"
            gradient="from-purple-500/10 to-purple-600/5 border-purple-500/30"
            trend={trends.pathways}
          />
          <MetricCard
            title="Total Conversions"
            value={metrics.totalConversions?.toLocaleString() || '0'}
            icon={Award}
            iconColor="bg-[#c8ff00]/20 text-[#c8ff00]"
            gradient="from-[#c8ff00]/10 to-[#c8ff00]/5 border-[#c8ff00]/30"
            trend={trends.conversions}
          />
        </div>
      );
    }
  };

  const renderFunnel = () => {
    if (currentMode === 'v2') {
      return (
        <div className="space-y-4">
          <ProgressBar 
            label="Quiz Start → Pricing" 
            value={metrics.reachedPricing || 0} 
            total={metrics.totalStarts || 1}
            color="bg-blue-500"
          />
          <ProgressBar 
            label="Pricing → Checkout" 
            value={metrics.checkoutInitiated || 0} 
            total={metrics.reachedPricing || 1}
            color="bg-purple-500"
          />
          <ProgressBar 
            label="Checkout → Payment" 
            value={metrics.paidCustomers || 0} 
            total={metrics.checkoutInitiated || 1}
            color="bg-[#c8ff00]"
          />
          
          <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">Overall Conversion Rate</span>
              <p className="text-xs text-gray-500">Quiz starts → Paid customers</p>
            </div>
            <span className="text-3xl font-black text-[#c8ff00]">
              {funnel.overallConversion || 0}%
            </span>
          </div>
        </div>
      );
    } else if (currentMode === 'v3') {
      return (
        <div className="space-y-4">
          <ProgressBar 
            label="Quiz Start → Completion" 
            value={metrics.totalCompletions || 0} 
            total={metrics.totalStarts || 1}
            color="bg-blue-500"
          />
          <ProgressBar 
            label="Completion → CTA Click" 
            value={metrics.totalCTAClicks || 0} 
            total={metrics.totalCompletions || 1}
            color="bg-purple-500"
          />
          <ProgressBar 
            label="CTA Click → Affiliate Redirect" 
            value={metrics.totalRedirects || 0} 
            total={metrics.totalCTAClicks || 1}
            color="bg-[#c8ff00]"
          />
          <ProgressBar 
            label="Email Capture Rate" 
            value={metrics.totalEmailCaptures || 0} 
            total={metrics.totalCompletions || 1}
            color="bg-cyan-500"
          />
          
          <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">Overall Conversion Rate</span>
              <p className="text-xs text-gray-500">Quiz starts → Affiliate redirects</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-[#c8ff00]">
                {funnel.overallConversion || 0}%
              </span>
              <TrendIndicator value={trends.conversionRate} />
            </div>
          </div>
        </div>
      );
    } else {
      // GeeNius mode
      return (
        <div className="space-y-4">
          <ProgressBar 
            label="Quiz Start → Results" 
            value={metrics.resultsViewed || 0} 
            total={metrics.totalStarts || 1}
            color="bg-blue-500"
          />
          <ProgressBar 
            label="Results → Pathway Selection" 
            value={metrics.pathwaySelections || 0} 
            total={metrics.resultsViewed || 1}
            color="bg-purple-500"
          />
          <ProgressBar 
            label="Pathway → Conversion" 
            value={metrics.totalConversions || 0} 
            total={metrics.pathwaySelections || 1}
            color="bg-[#c8ff00]"
          />
          
          <div className="pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Pathway #1</div>
                <div className="text-xl font-bold text-purple-400">{metrics.pathway1Clicks || 0}</div>
                <div className="text-xs text-gray-500">Gov Grant</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Pathway #2</div>
                <div className="text-xl font-bold text-blue-400">{metrics.pathway2Clicks || 0}</div>
                <div className="text-xs text-gray-500">Done For You</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Pathway #3</div>
                <div className="text-xl font-bold text-green-400">{metrics.pathway3Clicks || 0}</div>
                <div className="text-xs text-gray-500">DIY Checkout</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <div>
                <span className="font-semibold text-white">Overall Conversion Rate</span>
                <p className="text-xs text-gray-500">Quiz starts → Pathway clicks</p>
              </div>
              <span className="text-3xl font-black text-[#c8ff00]">
                {funnel.overallConversion || 0}%
              </span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with mode indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#c8ff00]" />
            {config.title}
          </h3>
          <p className="text-sm text-gray-400">{config.subtitle}</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['24h', '7d', '30d', '90d'].map(range => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              className={timeRange === range 
                ? 'bg-[#c8ff00] text-black hover:bg-[#d4ff33] font-bold' 
                : 'border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]'
              }
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Dynamic Metrics */}
      {renderMetrics()}

      {/* Conversion Funnel */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
            Conversion Funnel
            <Badge className="ml-2 bg-[#c8ff00]/20 text-[#c8ff00]">
              {funnel.overallConversion || 0}% Overall
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFunnel()}
        </CardContent>
      </Card>

      {/* Session Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Health Score"
          value={`${metrics.avgHealthScore || 0}/100`}
          icon={Award}
          iconColor="bg-blue-500/20 text-blue-400"
          gradient="from-gray-800 to-gray-900 border-gray-700"
          subtitle="Lower scores = more urgency"
        />
        <MetricCard
          title="Avg Session Time"
          value={metrics.avgSessionTime || '0m 0s'}
          icon={Clock}
          iconColor="bg-purple-500/20 text-purple-400"
          gradient="from-gray-800 to-gray-900 border-gray-700"
          subtitle="Time to complete quiz"
        />
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads?.toLocaleString() || '0'}
          icon={Users}
          iconColor="bg-green-500/20 text-green-400"
          gradient="from-gray-800 to-gray-900 border-gray-700"
          trend={trends.leads}
          subtitle={`${currentMode === 'v2' ? 'Stripe' : currentMode === 'v3' ? 'V3' : 'Geenius'} leads`}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${sessions.bounceRate || 0}%`}
          icon={AlertCircle}
          iconColor="bg-red-500/20 text-red-400"
          gradient="from-gray-800 to-gray-900 border-gray-700"
          subtitle="Single interaction exits"
        />
      </div>

      {/* Health Score Distribution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Health Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'critical', label: 'Critical (0-25)', color: 'bg-red-500', textColor: 'text-red-400' },
              { key: 'poor', label: 'Poor (26-50)', color: 'bg-orange-500', textColor: 'text-orange-400' },
              { key: 'fair', label: 'Fair (51-75)', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
              { key: 'good', label: 'Good (76-100)', color: 'bg-green-500', textColor: 'text-green-400' }
            ].map(({ key, label, color, textColor }) => (
              <div key={key} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className={`text-2xl font-black ${textColor}`}>
                  {healthScoreDistribution[key] || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
                <div className={`h-1 ${color} rounded-full mt-2 opacity-50`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exit Points & Pain Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Exit Point Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exitPoints.length > 0 ? exitPoints.map((ep, index) => (
                <motion.div
                  key={ep.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold capitalize">{ep.step?.replace(/_/g, ' ') || 'Unknown'}</span>
                    <Badge className="bg-orange-500/20 text-orange-300 font-bold">
                      {ep.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(ep.percentage), 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{ep.count} exits</div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">No exit data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
              <Target className="w-5 h-5 text-red-400" />
              Pain Point Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {painPoints.length > 0 ? painPoints.map((pp, index) => (
                <motion.div
                  key={pp.painPoint}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">{pp.label}</span>
                    <Badge className="bg-red-500/20 text-red-300 font-bold">
                      {pp.count} leads
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(pp.percentage), 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{pp.percentage}% of total</div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">No pain point data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Categories */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
            <PieChart className="w-5 h-5 text-[#c8ff00]" />
            Business Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.length > 0 ? categories.map((cat, index) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-gray-700 text-center hover:border-[#c8ff00]/50 transition-all"
              >
                <div className="text-3xl font-black text-white mb-2">{cat.count}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {cat.label}
                </div>
                <div className="text-xs text-[#c8ff00] mt-1">{cat.percentage}%</div>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                <PieChart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-bold">No category data yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <Calendar className="w-3 h-3 inline mr-1" />
        Data generated at {new Date(analytics?.generatedAt || Date.now()).toLocaleString()} • 
        {sessions.uniqueSessions?.toLocaleString() || '0'} unique sessions analyzed
      </div>
    </div>
  );
}