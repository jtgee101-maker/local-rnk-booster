import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Flag, Search, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoadFlags();
  }, []);

  const checkAuthAndLoadFlags = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(currentUser);
      await loadFlags();
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const loadFlags = async () => {
    try {
      setLoading(true);
      const settings = await base44.entities.AppSettings.filter({ category: 'feature_flag' });
      
      // If no flags exist, create default ones
      if (settings.length === 0) {
        const defaultFlags = [
          { key: 'enable_ab_testing', name: 'A/B Testing', description: 'Enable A/B testing across the platform', enabled: true, category: 'analytics' },
          { key: 'enable_advanced_analytics', name: 'Advanced Analytics', description: 'Enable advanced analytics dashboard', enabled: true, category: 'analytics' },
          { key: 'enable_ai_content', name: 'AI Content Generation', description: 'Enable AI-powered content generation', enabled: true, category: 'content' },
          { key: 'enable_email_automation', name: 'Email Automation', description: 'Enable automated email sequences', enabled: true, category: 'email' },
          { key: 'enable_location_content', name: 'Location Content', description: 'Enable location-based content generation', enabled: true, category: 'content' },
          { key: 'enable_campaign_tracking', name: 'Campaign Tracking', description: 'Enable campaign and PURL tracking', enabled: true, category: 'marketing' },
          { key: 'enable_affiliate_portal', name: 'Affiliate Portal', description: 'Enable affiliate management portal', enabled: false, category: 'marketing' },
          { key: 'enable_white_label', name: 'White Label Mode', description: 'Enable white label customization', enabled: false, category: 'general' },
          { key: 'maintenance_mode', name: 'Maintenance Mode', description: 'Put the platform in maintenance mode', enabled: false, category: 'system' }
        ];

        for (const flag of defaultFlags) {
          await base44.entities.AppSettings.create({
            setting_key: flag.key,
            setting_value: { enabled: flag.enabled, name: flag.name, description: flag.description, category: flag.category },
            category: 'feature_flag',
            description: flag.description
          });
        }
        
        await loadFlags();
        return;
      }

      const formattedFlags = settings.map(s => ({
        id: s.id,
        key: s.setting_key,
        name: s.setting_value.name || s.setting_key,
        description: s.setting_value.description || s.description,
        enabled: s.setting_value.enabled || false,
        category: s.setting_value.category || 'general'
      }));

      setFlags(formattedFlags);
    } catch (error) {
      console.error('Failed to load flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId, currentState) => {
    try {
      const flag = flags.find(f => f.id === flagId);
      await base44.entities.AppSettings.update(flagId, {
        setting_value: {
          ...flag,
          enabled: !currentState
        }
      });

      setFlags(flags.map(f => f.id === flagId ? { ...f, enabled: !currentState } : f));
      toast.success(`${flag.name} ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const filteredFlags = flags.filter(flag => 
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    const cat = flag.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Flag className="w-8 h-8 text-[#c8ff00]" />
              Feature Flags
            </h1>
            <p className="text-gray-400 mt-2">Control platform features and functionality</p>
          </div>
          <Button onClick={loadFlags} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <Card className="mb-6 bg-[#1a1a2e] border-gray-800">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feature flags..."
                className="pl-10 bg-[#0a0a0f] border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
            <Card key={category} className="bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl capitalize flex items-center gap-2">
                  {category}
                  <Badge variant="outline" className="text-xs">{categoryFlags.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {category === 'analytics' && 'Analytics and tracking features'}
                  {category === 'content' && 'Content generation and management'}
                  {category === 'email' && 'Email and communication features'}
                  {category === 'marketing' && 'Marketing and campaign features'}
                  {category === 'system' && 'System-level settings'}
                  {category === 'general' && 'General platform features'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-start justify-between p-4 bg-[#0a0a0f] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{flag.name}</h3>
                          <Badge
                            variant={flag.enabled ? 'default' : 'outline'}
                            className={flag.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'text-gray-500'}
                          >
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{flag.description}</p>
                        <p className="text-xs text-gray-600 mt-1 font-mono">{flag.key}</p>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                        className="data-[state=checked]:bg-[#c8ff00]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFlags.length === 0 && (
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No flags found</h3>
              <p className="text-gray-400">Try adjusting your search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}