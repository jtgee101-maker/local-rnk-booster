import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Flag, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const colors = {
  brand: { DEFAULT: '#c8ff00', foreground: '#0a0a0f' }
};

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({ category: 'feature_flag' });
      setFlags(settings);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flag) => {
    try {
      await base44.entities.AppSettings.update(flag.id, {
        is_active: !flag.is_active
      });
      setFlags(flags.map(f => f.id === flag.id ? { ...f, is_active: !f.is_active } : f));
    } catch (error) {
      console.error('Error toggling flag:', error);
      alert('Failed to toggle feature flag');
    }
  };

  const createFlag = async () => {
    if (!newFlagName.trim()) {
      alert('Please enter a flag name');
      return;
    }

    setSaving(true);
    try {
      const newFlag = await base44.entities.AppSettings.create({
        setting_key: `feature_${newFlagName.toLowerCase().replace(/\s+/g, '_')}`,
        setting_value: { enabled: true },
        category: 'feature_flag',
        description: newFlagDesc || `Feature flag for ${newFlagName}`,
        is_active: false
      });

      setFlags([...flags, newFlag]);
      setNewFlagName('');
      setNewFlagDesc('');
    } catch (error) {
      console.error('Error creating flag:', error);
      alert('Failed to create feature flag');
    } finally {
      setSaving(false);
    }
  };

  const deleteFlag = async (flagId) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;

    try {
      await base44.entities.AppSettings.delete(flagId);
      setFlags(flags.filter(f => f.id !== flagId));
    } catch (error) {
      console.error('Error deleting flag:', error);
      alert('Failed to delete feature flag');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-400">Loading feature flags...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Flag className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
            <p className="text-sm text-gray-400">Control feature rollout and A/B testing</p>
          </div>
        </div>

        {/* Create New Flag */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" style={{color: colors.brand.DEFAULT}} />
              Create New Feature Flag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Flag name (e.g., new_checkout_flow)"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Input
                placeholder="Description (optional)"
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button 
              onClick={createFlag}
              disabled={saving || !newFlagName.trim()}
              className="w-full"
              style={{backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground}}
            >
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Flag'}
            </Button>
          </CardContent>
        </Card>

        {/* Feature Flags List */}
        <div className="grid gap-4">
          {flags.length === 0 ? (
            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="py-12 text-center">
                <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No feature flags yet. Create your first one above.</p>
              </CardContent>
            </Card>
          ) : (
            flags.map((flag) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-sm font-mono text-white bg-gray-800 px-2 py-1 rounded">
                            {flag.setting_key}
                          </code>
                          <Badge variant={flag.is_active ? 'default' : 'outline'} style={flag.is_active ? {backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground} : {}}>
                            {flag.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{flag.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={flag.is_active}
                          onCheckedChange={() => toggleFlag(flag)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFlag(flag.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}