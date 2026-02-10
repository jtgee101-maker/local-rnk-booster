import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { Flag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlags() {
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = '/QuizGeenius';
          return;
        }
        setUser(currentUser);
      } catch (err) {
        window.location.href = '/QuizGeenius';
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadFlags();
    }
  }, [user]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const settings = await base44.entities.AppSettings.filter({ category: 'feature_flag' });
      setFlags(settings.map(s => ({
        id: s.id,
        name: s.setting_value?.name || s.setting_key,
        enabled: s.setting_value?.enabled || false
      })));
    } catch (err) {
      toast.error('Failed to load flags');
    }
    setLoading(false);
  };

  const toggleFlag = async (id, current) => {
    try {
      const flag = flags.find(f => f.id === id);
      await base44.entities.AppSettings.update(id, {
        setting_value: { ...flag, enabled: !current }
      });
      setFlags(flags.map(f => f.id === id ? { ...f, enabled: !current } : f));
      toast.success('Updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Flag className="w-8 h-8 text-[#c8ff00]" />
            Feature Flags
          </h1>
          <Button onClick={loadFlags} className="bg-[#c8ff00] text-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {flags.map(flag => (
            <Card key={flag.id} className="bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{flag.name}</CardTitle>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}