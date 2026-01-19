import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    apiKey: '••••••••••••••••••••••••',
    webhookUrl: 'https://api.localrank.ai/webhooks',
    emailProvider: 'SendGrid',
    stripeKey: '••••••••••••••••••••••••',
    maxConcurrentNurtures: 1000,
    emailRateLimit: 100
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">API Key</label>
            <div className="flex gap-2 mt-1">
              <Input
                type="password"
                value={settings.apiKey}
                readOnly
                className="bg-gray-900 border-gray-700"
              />
              <Button variant="outline" size="sm">Copy</Button>
              <Button variant="outline" size="sm">Rotate</Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Webhook URL</label>
            <Input
              value={settings.webhookUrl}
              readOnly
              className="bg-gray-900 border-gray-700 mt-1"
            />
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200">Rotate API key every 90 days for security</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div>
              <p className="font-medium text-white">{settings.emailProvider}</p>
              <p className="text-sm text-gray-400">Email delivery provider</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div>
              <p className="font-medium text-white">Stripe Payments</p>
              <p className="text-sm text-gray-400">Payment processing</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Rate Limiting & Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Max Concurrent Nurtures</label>
            <Input
              type="number"
              value={settings.maxConcurrentNurtures}
              onChange={(e) => setSettings({...settings, maxConcurrentNurtures: parseInt(e.target.value)})}
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of active nurture sequences</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Email Rate Limit (per minute)</label>
            <Input
              type="number"
              value={settings.emailRateLimit}
              onChange={(e) => setSettings({...settings, emailRateLimit: parseInt(e.target.value)})}
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Emails to send per minute (prevents provider throttling)</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveSettings} className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
          Save Settings
        </Button>
      </div>
    </div>
  );
}