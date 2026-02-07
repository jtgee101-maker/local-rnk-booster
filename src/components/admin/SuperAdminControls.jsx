// Super Admin Controls Component
// Only visible to admin users
import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SuperAdminControls() {
  const { config, setConfig } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleFeatureToggle = (feature, value) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value }
    }));
  };

  const handleColorChange = (colorKey, value) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value }
    }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/admin/brand-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Brand Name</Label>
              <Input 
                value={config.name}
                onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input 
                value={config.tagline}
                onChange={e => setConfig(p => ({ ...p, tagline: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {Object.entries(config.colors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={e => handleColorChange(key, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center justify-between">
              <Label className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</Label>
              <Switch
                checked={enabled}
                onCheckedChange={v => handleFeatureToggle(feature, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={saveConfig} disabled={isSaving} className="w-full">
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
