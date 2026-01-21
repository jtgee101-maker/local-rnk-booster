import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail, ShoppingCart, MousePointer, Clock, DollarSign } from 'lucide-react';

export default function CustomerJourneyView() {
  const [leadId, setLeadId] = useState('');
  const [searchLeadId, setSearchLeadId] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-journey', searchLeadId],
    queryFn: async () => {
      if (!searchLeadId) return null;
      const response = await base44.functions.invoke('analytics/customerJourney', {
        lead_id: searchLeadId
      });
      return response.data;
    },
    enabled: !!searchLeadId,
    staleTime: 60 * 1000
  });

  const handleSearch = () => {
    setSearchLeadId(leadId);
    refetch();
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
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Search Customer Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Lead ID..."
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Button onClick={handleSearch} disabled={!leadId} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journey Data */}
      {isLoading && (
        <div className="text-center text-gray-400 py-8">Loading journey...</div>
      )}

      {data && data.lead && (
        <>
          {/* Lead Summary */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Lead Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Business</div>
                  <div className="text-lg font-semibold text-white">{data.lead.business_name}</div>
                  <div className="text-xs text-gray-500">{data.lead.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div className={`text-lg font-semibold capitalize ${
                    data.lead.status === 'converted' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {data.lead.status}
                  </div>
                  <div className="text-xs text-gray-500">Health: {data.lead.health_score}/100</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Lifetime Value</div>
                  <div className="text-lg font-semibold text-[#c8ff00]">
                    ${data.ltv?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{data.orders_count} order(s)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Conversion</div>
                  <div className="text-lg font-semibold text-white">
                    {data.conversion_rate > 0 ? 'Yes' : 'Not yet'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(data.lead.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Customer Journey Timeline</CardTitle>
              <p className="text-sm text-gray-400">{data.timeline?.length} touchpoints</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.timeline?.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getEventColor(item.type)}`}>
                        {getEventIcon(item.type)}
                      </div>
                      {idx < data.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-800 mt-2" />
                      )}
                    </div>

                    {/* Event details */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-white font-semibold capitalize">
                              {item.type === 'event' && item.event}
                              {item.type === 'email' && `Email: ${item.subject}`}
                              {item.type === 'order' && `Order: ${item.status}`}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
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
                          <div className="mt-2 flex gap-3 text-xs">
                            <span className={`${item.opened ? 'text-green-400' : 'text-gray-500'}`}>
                              {item.opened ? '✓ Opened' : '✗ Not opened'}
                            </span>
                            <span className="text-gray-500">Status: {item.status}</span>
                          </div>
                        )}
                        
                        {item.type === 'event' && item.data && Object.keys(item.data).length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            {Object.entries(item.data).slice(0, 3).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span> {String(value).substring(0, 50)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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