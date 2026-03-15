import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Mail, ShoppingCart, MousePointer, Clock, DollarSign, 
  Download, RefreshCw, Loader2, AlertTriangle,
  Calendar, Filter, Zap, Target, Activity
} from 'lucide-react';

export default function CustomerJourneyView() {
  const [leadId, setLeadId] = useState('');
  const [searchLeadId, setSearchLeadId] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['customer-journey', searchLeadId],
    queryFn: async () => {
      if (!searchLeadId) return null;
      const response = await base44.functions.invoke('analytics/customerJourney', {
        lead_id: searchLeadId
      });
      return response.data;
    },
    enabled: !!searchLeadId,
    staleTime: 60 * 1000,
    retry: 1
  });

  const handleSearch = () => {
    setSearchLeadId(leadId);
    setEventFilter('all');
    setSearchQuery('');
  };

  // Filter timeline
  const filteredTimeline = useMemo(() => {
    if (!data?.timeline) return [];
    
    let filtered = data.timeline;
    
    // Filter by event type
    if (eventFilter !== 'all') {
      filtered = filtered.filter(item => item.type === eventFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.event?.toLowerCase().includes(searchLower) ||
          item.subject?.toLowerCase().includes(searchLower) ||
          item.status?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [data?.timeline, eventFilter, searchQuery]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!data) return null;
    
    const timeline = data.timeline || [];
    const firstEvent = timeline[0];
    const lastEvent = timeline[timeline.length - 1];
    const conversionEvent = timeline.find(item => item.type === 'order');
    
    let avgTimeToConversion = null;
    if (conversionEvent && firstEvent) {
      const diff = new Date(conversionEvent.timestamp) - new Date(firstEvent.timestamp);
      avgTimeToConversion = Math.floor(diff / (1000 * 60 * 60 * 24)); // days
    }
    
    const emailsSent = timeline.filter(item => item.type === 'email').length;
    const emailsOpened = timeline.filter(item => item.type === 'email' && item.opened).length;
    const emailOpenRate = emailsSent > 0 ? (emailsOpened / emailsSent * 100).toFixed(1) : 0;
    
    const totalTouchpoints = timeline.length;
    const eventTypes = [...new Set(timeline.map(item => item.type))];
    
    return {
      avgTimeToConversion,
      emailsSent,
      emailsOpened,
      emailOpenRate,
      totalTouchpoints,
      eventTypes,
      firstEventDate: firstEvent?.timestamp,
      lastEventDate: lastEvent?.timestamp
    };
  }, [data]);

  // Export function
  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Customer Journey Report'],
      ['Lead ID', searchLeadId],
      ['Business', data.lead.business_name],
      ['Email', data.lead.email],
      ['Generated', new Date().toISOString()],
      '',
      ['Timestamp', 'Type', 'Event', 'Details', 'Amount'].join(','),
      ...filteredTimeline.map(item => [
        new Date(item.timestamp).toISOString(),
        item.type,
        item.event || item.subject || item.status || '',
        item.opened ? 'Opened' : item.data ? JSON.stringify(item.data) : '',
        item.amount || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-journey-${searchLeadId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'event':
        return <MousePointer className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'event':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'email':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'order':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
              <Activity className="w-5 h-5 text-[#c8ff00]" />
            </div>
            <div>
              <CardTitle className="text-white">Customer Journey Explorer</CardTitle>
              <CardDescription>
                View detailed customer interaction timeline
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Lead ID..."
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!leadId || isLoading} 
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">Loading customer journey...</p>
              <p className="text-xs text-gray-500 mt-1">Fetching interaction timeline</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-gray-900/50">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">Failed to load journey</p>
              <p className="text-xs text-gray-400 mt-1">{error.message}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.lead && (
        <>
          {/* Key Insights */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-gray-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Time to Conversion</p>
                      <p className="text-xl font-bold text-white">
                        {insights.avgTimeToConversion !== null ? `${insights.avgTimeToConversion} days` : 'Not converted'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-gray-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email Open Rate</p>
                      <p className="text-xl font-bold text-white">
                        {insights.emailOpenRate}%
                      </p>
                      <p className="text-xs text-gray-500">{insights.emailsOpened}/{insights.emailsSent} opened</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-gray-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Touchpoints</p>
                      <p className="text-xl font-bold text-white">
                        {insights.totalTouchpoints}
                      </p>
                      <p className="text-xs text-gray-500">{insights.eventTypes.length} types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Lead Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                    <Zap className="w-5 h-5 text-[#c8ff00]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Lead Summary</CardTitle>
                    <CardDescription>Customer overview and metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Business</div>
                    <div className="text-base font-semibold text-white">{data.lead.business_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{data.lead.email}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Status</div>
                    <Badge className={`${
                      data.lead.status === 'converted' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    } capitalize text-sm`}>
                      {data.lead.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-2">Health: {data.lead.health_score}/100</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Lifetime Value</div>
                    <div className="text-base font-semibold text-[#c8ff00]">
                      ${data.ltv?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{data.orders_count} order(s)</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">First Seen</div>
                    <div className="text-base font-semibold text-white">
                      {new Date(data.lead.created_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {data.conversion_rate > 0 ? '✓ Converted' : 'Not converted'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-[#c8ff00]" />
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        Journey Timeline
                        <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/30">
                          {filteredTimeline.length} events
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Chronological interaction history
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <Select value={eventFilter} onValueChange={setEventFilter}>
                        <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="event">Events</SelectItem>
                          <SelectItem value="email">Emails</SelectItem>
                          <SelectItem value="order">Orders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-32 h-9 bg-gray-800/50 border-gray-700 text-white text-xs"
                    />
                    <Button
                      onClick={() => refetch()}
                      variant="ghost"
                      size="sm"
                      disabled={isRefetching}
                      className="gap-2 text-gray-400 hover:text-white h-9 px-3"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00] h-9 px-3"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <div className="space-y-6">
                    {filteredTimeline.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex gap-4"
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.1 }}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getEventColor(item.type)}`}
                          >
                            {getEventIcon(item.type)}
                          </motion.div>
                          {idx < filteredTimeline.length - 1 && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: '100%' }}
                              transition={{ delay: idx * 0.05 + 0.2 }}
                              className="w-0.5 bg-gray-700 mt-2"
                            />
                          )}
                        </div>

                        {/* Event details */}
                        <div className="flex-1 pb-6">
                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-[#c8ff00]/30 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-white font-semibold capitalize flex items-center gap-2">
                                  {item.type === 'event' && item.event}
                                  {item.type === 'email' && `Email: ${item.subject}`}
                                  {item.type === 'order' && `Order: ${item.status}`}
                                  <Badge className={`${getEventColor(item.type)} text-xs`}>
                                    {item.type}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.timestamp).toLocaleString()}
                                </div>
                              </div>
                              {item.type === 'order' && item.amount && (
                                <div className="flex items-center gap-1 text-[#c8ff00] font-bold">
                                  <DollarSign className="w-4 h-4" />
                                  {item.amount}
                                </div>
                              )}
                            </div>
                            
                            {/* Additional data */}
                            {item.type === 'email' && (
                              <div className="mt-3 flex gap-3 text-xs">
                                <Badge className={`${item.opened ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                  {item.opened ? '✓ Opened' : '✗ Not opened'}
                                </Badge>
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                  {item.status}
                                </Badge>
                              </div>
                            )}
                            
                            {item.type === 'event' && item.data && Object.keys(item.data).length > 0 && (
                              <div className="mt-3 p-2 rounded bg-gray-900/50 border border-gray-700">
                                <div className="text-xs text-gray-400 space-y-1">
                                  {Object.entries(item.data).slice(0, 3).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-gray-500 font-medium">{key}:</span> 
                                      <span className="text-white">{String(value).substring(0, 50)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {searchLeadId && !isLoading && !data && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-8 text-center text-gray-400">
            No journey found for this Lead ID
          </CardContent>
        </Card>
      )}
    </div>
  );
}