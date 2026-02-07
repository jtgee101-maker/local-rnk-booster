import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Mail, DollarSign, TestTube, Save } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState('');

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list()
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value, category, description }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        return await base44.entities.AppSettings.update(existing.id, {
          setting_value: value,
          category,
          description
        });
      } else {
        return await base44.entities.AppSettings.create({
          setting_key: key,
          setting_value: value,
          category,
          description
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  });

  const getSetting = (key, defaultValue = null) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value ?? defaultValue;
  };

  const handleSave = (key, value, category, description) => {
    saveMutation.mutate({ key, value, category, description });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your app settings and integrations</p>
          {saveStatus && (
            <div className="mt-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-lg">
              {saveStatus}
            </div>
          )}
        </div>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="email" className="data-[state=active]:bg-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-gray-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="abtest" className="data-[state=active]:bg-gray-700">
              <TestTube className="w-4 h-4 mr-2" />
              A/B Tests
            </TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <EmailSettings getSetting={getSetting} handleSave={handleSave} />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettings getSetting={getSetting} handleSave={handleSave} />
          </TabsContent>

          <TabsContent value="abtest">
            <ABTestSettings />
          </TabsContent>

          <TabsContent value="general">
            <GeneralSettings getSetting={getSetting} handleSave={handleSave} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmailSettings({ getSetting, handleSave }) {
  const [adminEmail, setAdminEmail] = useState(getSetting('admin_email', 'admin@localrank.ai'));
  const [fromName, setFromName] = useState(getSetting('email_from_name', 'LocalRank.ai'));
  const [welcomeEnabled, setWelcomeEnabled] = useState(getSetting('welcome_email_enabled', true));
  const [abandonedCartEnabled, setAbandonedCartEnabled] = useState(getSetting('abandoned_cart_enabled', true));

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">Admin Email</Label>
            <Input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
              placeholder="admin@localrank.ai"
            />
            <p className="text-sm text-gray-500 mt-1">Email address to receive admin notifications</p>
          </div>

          <div>
            <Label className="text-gray-300">From Name</Label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
              placeholder="LocalRank.ai"
            />
            <p className="text-sm text-gray-500 mt-1">Name shown in emails sent to customers</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Welcome Email</Label>
              <p className="text-sm text-gray-500">Send welcome email to new leads</p>
            </div>
            <Switch
              checked={welcomeEnabled}
              onCheckedChange={setWelcomeEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Abandoned Cart Emails</Label>
              <p className="text-sm text-gray-500">Send reminders to users who didn't complete checkout</p>
            </div>
            <Switch
              checked={abandonedCartEnabled}
              onCheckedChange={setAbandonedCartEnabled}
            />
          </div>

          <Button
            onClick={() => {
              handleSave('admin_email', adminEmail, 'email', 'Admin notification email');
              handleSave('email_from_name', fromName, 'email', 'From name for emails');
              handleSave('welcome_email_enabled', welcomeEnabled, 'email', 'Enable welcome emails');
              handleSave('abandoned_cart_enabled', abandonedCartEnabled, 'email', 'Enable abandoned cart emails');
            }}
            className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black min-h-[44px] touch-manipulation"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Email Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSettings({ getSetting, handleSave }) {
  const [testMode, setTestMode] = useState(getSetting('stripe_test_mode', false));
  const [currency, setCurrency] = useState(getSetting('currency', 'usd'));
  const [refundPolicy, setRefundPolicy] = useState(getSetting('refund_policy_days', 30));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Payment Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            💡 Stripe API keys are configured as environment secrets in the dashboard
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-gray-300">Test Mode</Label>
            <p className="text-sm text-gray-500">Use Stripe test keys instead of live</p>
          </div>
          <Switch
            checked={testMode}
            onCheckedChange={setTestMode}
          />
        </div>

        <div>
          <Label className="text-gray-300">Currency</Label>
          <Input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
            placeholder="usd"
          />
        </div>

        <div>
          <Label className="text-gray-300">Refund Policy (Days)</Label>
          <Input
            type="number"
            value={refundPolicy}
            onChange={(e) => setRefundPolicy(parseInt(e.target.value))}
            className="bg-gray-900 border-gray-700 text-white"
          />
          <p className="text-sm text-gray-500 mt-1">Number of days customers can request refunds</p>
        </div>

        <Button
          onClick={() => {
            handleSave('stripe_test_mode', testMode, 'payment', 'Use Stripe test mode');
            handleSave('currency', currency, 'payment', 'Default currency');
            handleSave('refund_policy_days', refundPolicy, 'payment', 'Refund policy days');
          }}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black min-h-[44px] touch-manipulation"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Payment Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function ABTestSettings() {
  const queryClient = useQueryClient();
  
  const { data: tests = [] } = useQuery({
    queryKey: ['abtests'],
    queryFn: () => base44.entities.ABTest.list()
  });

  const updateTestMutation = useMutation({
    mutationFn: async ({ testId, status }) => {
      return await base44.entities.ABTest.update(testId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abtests'] });
    }
  });

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Active A/B Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.length === 0 ? (
            <p className="text-gray-400">No A/B tests configured</p>
          ) : (
            tests.map(test => (
              <div key={test.id} className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-semibold">{test.name}</h4>
                  <p className="text-sm text-gray-400">
                    {test.page} - {test.element} • {test.variants.length} variants
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    test.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    test.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {test.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newStatus = test.status === 'active' ? 'paused' : 'active';
                      updateTestMutation.mutate({ testId: test.id, status: newStatus });
                    }}
                    className="min-h-[36px] touch-manipulation"
                  >
                    {test.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralSettings({ getSetting, handleSave }) {
  const [siteName, setSiteName] = useState(getSetting('site_name', 'LocalRank.ai'));
  const [supportEmail, setSupportEmail] = useState(getSetting('support_email', 'support@localrank.ai'));
  const [maintenanceMode, setMaintenanceMode] = useState(getSetting('maintenance_mode', false));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300">Site Name</Label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <Label className="text-gray-300">Support Email</Label>
          <Input
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-gray-300">Maintenance Mode</Label>
            <p className="text-sm text-gray-500">Show maintenance page to non-admin users</p>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={setMaintenanceMode}
          />
        </div>

        <Button
          onClick={() => {
            handleSave('site_name', siteName, 'general', 'Site name');
            handleSave('support_email', supportEmail, 'general', 'Support email address');
            handleSave('maintenance_mode', maintenanceMode, 'general', 'Maintenance mode enabled');
          }}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black min-h-[44px] touch-manipulation"
        >
          <Save className="w-4 h-4 mr-2" />
          Save General Settings
        </Button>
      </CardContent>
    </Card>
  );
}