import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe, CheckCircle, XCircle, Copy, ExternalLink, 
  Loader2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomDomainGuide() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testDomain, setTestDomain] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const testDomainConnection = async () => {
    if (!testDomain) {
      toast.error('Please enter a domain to test');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(testDomain);
      if (response.ok) {
        setTestResult({
          status: 'success',
          message: `Domain ${testDomain} is accessible and responding`,
          statusCode: response.status
        });
        toast.success('Domain is accessible!');
      } else {
        setTestResult({
          status: 'warning',
          message: `Domain responded with status ${response.status}`,
          statusCode: response.status
        });
        toast.warning(`Domain returned status ${response.status}`);
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: `Failed to connect to ${testDomain}: ${error.message}`,
        error: error.message
      });
      toast.error('Domain not accessible');
    } finally {
      setTesting(false);
    }
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
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400">Domain setup requires admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    {
      number: 1,
      title: 'Purchase Your Domain',
      description: 'Get a domain from a registrar like Namecheap, GoDaddy, or Google Domains',
      details: [
        'Choose a memorable domain (e.g., localrank.com, yourbrand.com)',
        'Complete the purchase and verify ownership',
        'Access your domain\'s DNS management panel'
      ]
    },
    {
      number: 2,
      title: 'Configure DNS Records',
      description: 'Point your domain to Base44\'s servers',
      details: [
        'Log into your domain registrar',
        'Navigate to DNS management',
        'Add the DNS records shown below',
        'Wait 5-60 minutes for DNS propagation'
      ]
    },
    {
      number: 3,
      title: 'Add Domain in Base44 Dashboard',
      description: 'Configure your custom domain in Base44',
      details: [
        'Go to Base44 dashboard → Settings → Domains',
        'Click "Add Custom Domain"',
        'Enter your domain (e.g., localrank.com)',
        'Wait for SSL certificate generation (automatic)'
      ]
    },
    {
      number: 4,
      title: 'Update App Configuration',
      description: 'Update your app to use the new domain',
      details: [
        'Go to Domain Setup page in this app',
        'Enter your custom domain URL',
        'Save the configuration',
        'Test all email templates'
      ]
    },
    {
      number: 5,
      title: 'Verify & Test',
      description: 'Ensure everything works correctly',
      details: [
        'Visit your custom domain in a browser',
        'Test the quiz flow from start to finish',
        'Verify email links use your domain',
        'Check analytics are tracking properly'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <h1 className="text-4xl font-black text-white">Custom Domain Setup</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Complete guide to setting up your custom domain on Base44
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-[#c8ff00] transition-colors"
                onClick={() => window.open('https://base44.com/dashboard', '_blank')}>
            <CardContent className="py-6 text-center">
              <ExternalLink className="w-8 h-8 mx-auto mb-2" style={{ color: '#c8ff00' }} />
              <div className="font-bold text-white">Base44 Dashboard</div>
              <div className="text-sm text-gray-400">Configure domains</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-[#c8ff00] transition-colors"
                onClick={() => window.location.href = '/DomainSetup'}>
            <CardContent className="py-6 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: '#c8ff00' }} />
              <div className="font-bold text-white">Domain Setup</div>
              <div className="text-sm text-gray-400">Update app config</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-[#c8ff00] transition-colors"
                onClick={() => window.location.href = '/AnalyticsVerification'}>
            <CardContent className="py-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#c8ff00' }} />
              <div className="font-bold text-white">Verify Setup</div>
              <div className="text-sm text-gray-400">Test everything</div>
            </CardContent>
          </Card>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-4">
          {steps.map((step) => (
            <Card key={step.number} className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black"
                       style={{ backgroundColor: '#c8ff00' }}>
                    {step.number}
                  </div>
                  <div>
                    <CardTitle className="text-white">{step.title}</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#c8ff00' }} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DNS Records */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Required DNS Records</CardTitle>
            <p className="text-sm text-gray-400 mt-2">
              Add these records in your domain registrar's DNS management panel
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  <strong>Note:</strong> Contact Base44 support for your specific DNS records. 
                  These vary based on your app configuration.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      A Record
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('@ → [Base44 IP]')}
                      className="text-gray-400"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm text-gray-300">
                    <div>Type: <span className="text-white">A</span></div>
                    <div>Name: <span className="text-white">@</span></div>
                    <div>Value: <span className="text-white">[Provided by Base44]</span></div>
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      CNAME Record
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('www → [Base44 CNAME]')}
                      className="text-gray-400"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm text-gray-300">
                    <div>Type: <span className="text-white">CNAME</span></div>
                    <div>Name: <span className="text-white">www</span></div>
                    <div>Value: <span className="text-white">[Provided by Base44]</span></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Tester */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Domain Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="https://yourdomain.com"
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <Button
                onClick={testDomainConnection}
                disabled={testing}
                style={{ backgroundColor: '#c8ff00' }}
                className="text-black font-bold hover:opacity-90"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.status === 'success' ? 'bg-green-500/10 border-green-500/30' :
                testResult.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {testResult.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />}
                  {testResult.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />}
                  {testResult.status === 'error' && <XCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">
                      {testResult.status === 'success' ? 'Success!' : 
                       testResult.status === 'warning' ? 'Warning' : 'Error'}
                    </p>
                    <p className="text-sm text-gray-300">{testResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">❌ Domain not accessible</h4>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Solution:</strong> DNS propagation can take up to 48 hours. Use a DNS checker tool to verify your records are set correctly.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">❌ SSL certificate errors</h4>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Solution:</strong> Base44 automatically generates SSL certificates. Wait 15-30 minutes after adding the domain. If issues persist, contact support.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">❌ Email links still show old domain</h4>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Solution:</strong> Update domain configuration in the Domain Setup page and test email templates.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">❌ www vs non-www redirect issues</h4>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Solution:</strong> Ensure both A record (@) and CNAME (www) are configured. Base44 handles redirects automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Helpful Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between p-3 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors">
                <span className="text-gray-300">DNS Checker - Verify DNS propagation</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
              <a href="https://www.whatsmydns.net" target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between p-3 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors">
                <span className="text-gray-300">What's My DNS - Global DNS lookup</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
              <a href="https://www.ssllabs.com/ssltest" target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between p-3 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors">
                <span className="text-gray-300">SSL Labs - Test SSL certificate</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}