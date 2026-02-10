import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Mail, Play, Pause, Plus, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailAutomationPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await base44.entities.EmailCampaign.filter({}, '-created_date');
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCampaign = async (campaignId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await base44.entities.EmailCampaign.update(campaignId, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Automations</h2>
          <p className="text-gray-400 text-sm">Manage AI-powered email campaigns</p>
        </div>
        <Button className="bg-[#c8ff00] text-black hover:bg-[#a8dd00]">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.status === 'active').length}
                </div>
                <div className="text-xs text-gray-400">Active Campaigns</div>
              </div>
              <Mail className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Emails Sent</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Opens</div>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {campaigns.length > 0 
                    ? Math.round((campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0) / campaigns.reduce((sum, c) => sum + (c.stats?.sent || 1), 1)) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-400">Avg Open Rate</div>
              </div>
              <TrendingUp className="w-8 h-8 text-[#c8ff00]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No campaigns yet. Create your first automated email campaign.</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {campaign.trigger_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{campaign.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Sent: {campaign.stats?.sent || 0}</span>
                      <span>•</span>
                      <span>Opens: {campaign.stats?.opened || 0}</span>
                      <span>•</span>
                      <span>Clicks: {campaign.stats?.clicked || 0}</span>
                      <span>•</span>
                      <span>Conversions: {campaign.stats?.converted || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                      className="border-gray-700"
                    >
                      {campaign.status === 'active' ? (
                        <><Pause className="w-4 h-4 mr-2" /> Pause</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Activate</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}