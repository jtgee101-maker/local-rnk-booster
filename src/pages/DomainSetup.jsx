import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Check, X, Loader2, ExternalLink, Copy, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function DomainSetup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState('https://localrnk.com');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser?.role === 'admin') {
          // Fetch current domain config
          const configs = await base44.entities.AppConfig.filter({
            config_key: 'production_domain',
            is_active: true
          });
          
          if (configs && configs.length > 0) {
            setDomain(configs[0].config_value);
            setIsConfigured(true);
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const saveDomain = async () => {
    setSaving(true);
    try {
      // Validate domain format
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        toast.error('Domain must start with http:// or https://');
        setSaving(false);
        return;
      }

      // Check if config exists
      const existing = await base44.entities.AppConfig.filter({
        config_key: 'production_domain'
      });

      if (existing && existing.length > 0) {
        // Update existing
        await base44.entities.AppConfig.update(existing[0].id, {
          config_value: domain,
          is_active: true
        });
      } else {
        // Create new
        await base44.entities.AppConfig.create({
          config_key: 'production_domain',
          config_value: domain,
          category: 'domain',
          is_active: true,
          description: 'Production domain for email links and redirects'
        });
      }

      setIsConfigured(true);
      toast.success('Domain configuration saved!');
    } catch (error) {
      console.error('Failed to save domain:', error);
      toast.error('Failed to save domain configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-red-500/50 max-w-md">
          <CardContent className="py-8 text-center">
            <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <h1 className="text-4xl font-black text-white">Production Domain Setup</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Configure your custom domain for email links and app redirects
          </p>
          {isConfigured && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="w-3 h-3 mr-1" /> Domain Configured
            </Badge>
          )}
        </div>

        {/* Domain Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#c8ff00' }} />
              Domain Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Production Domain URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
                <Button
                  onClick={saveDomain}
                  disabled={saving}
                  style={{ backgroundColor: '#c8ff00' }}
                  className="text-black font-bold hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This domain will be used in all email templates for links and CTAs
              </p>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                <strong>Important:</strong> Configure your custom domain in Base44 dashboard first, then update it here.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* What Gets Updated */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">What Gets Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded">
                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="font-semibold">All Email Templates</div>
                  <div className="text-sm text-gray-400">Quiz results, order confirmations, upsells, abandoned cart</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded">
                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="font-semibold">Admin Notifications</div>
                  <div className="text-sm text-gray-400">New lead alerts, upsell notifications</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded">
                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="font-semibold">CTA Links</div>
                  <div className="text-sm text-gray-400">Dashboard, checkout, pricing, thank you page links</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Links */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Your Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: 'Home/Quiz', path: '/QuizV3' },
                { label: 'Checkout', path: '/CheckoutV2' },
                { label: 'Pricing', path: '/Pricing' },
                { label: 'Dashboard', path: '/Dashboard' },
                { label: 'Admin', path: '/Admin' }
              ].map(({ label, path }) => (
                <div
                  key={path}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-700"
                >
                  <div>
                    <div className="text-white font-semibold">{label}</div>
                    <div className="text-sm text-gray-400 font-mono">{domain}{path}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${domain}${path}`)}
                      className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${domain}${path}`, '_blank')}
                      className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li>Configure your custom domain in Base44 dashboard</li>
              <li>Update the domain URL above and click Save</li>
              <li>Test email sending with <code className="bg-gray-900 px-2 py-1 rounded text-sm">sendWelcomeEmail</code> function</li>
              <li>Verify all links in emails point to your custom domain</li>
              <li>Run production checklist to verify all systems</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}