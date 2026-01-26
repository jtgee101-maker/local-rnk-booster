import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, Copy, CheckCircle2, AlertCircle, ExternalLink,
  Mail, Settings, Code, Zap, ArrowRight
} from 'lucide-react';

export default function DomainConfigGuide() {
  const [domain, setDomain] = useState('yourdomain.com');
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const urlsToUpdate = [
    {
      category: 'Email Templates',
      icon: Mail,
      files: [
        { path: 'functions/utils/enhancedEmailTemplates.js', line: 158, current: 'https://localrnk.com/CheckoutV2', replace: `https://${domain}/CheckoutV2` }
      ]
    },
    {
      category: 'Quiz Components',
      icon: Code,
      files: [
        { path: 'components/quizv3/ResultsV3.js', description: 'Check for any hardcoded affiliate links' }
      ]
    },
    {
      category: 'Admin Functions',
      icon: Settings,
      files: [
        { path: 'All backend functions', description: 'Search for "localrnk.com" or hardcoded URLs' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className="w-8 h-8 text-[#c8ff00]" />
            <h1 className="text-4xl font-black text-white">Custom Domain Setup</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Complete guide for configuring your production domain
          </p>
        </div>

        {/* Domain Input */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Custom Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Button 
                variant="outline" 
                className="border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00] hover:text-black"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Set Domain
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your custom domain to generate updated configuration
            </p>
          </CardContent>
        </Card>

        {/* Step 1: Base44 Dashboard */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="bg-[#c8ff00] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</span>
              Configure in Base44 Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-500/20 border-blue-500/50">
              <ExternalLink className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Go to Base44 Dashboard → Settings → Custom Domain and configure <strong>{domain}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-gray-300 font-semibold">DNS Configuration Required:</p>
              <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-mono">A Record</div>
                    <div className="text-white font-mono">@ → [Base44 IP]</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('@', 'dns1')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'dns1' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-mono">CNAME Record</div>
                    <div className="text-white font-mono">www → [Base44 Domain]</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('www', 'dns2')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'dns2' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="bg-yellow-500/20 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300 text-sm">
                DNS propagation can take 24-48 hours. Verify SSL certificate is active before proceeding.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 2: Update Hardcoded URLs */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="bg-[#c8ff00] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</span>
              Update Hardcoded URLs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urlsToUpdate.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.category} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-[#c8ff00]" />
                      <h3 className="text-white font-semibold">{section.category}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {section.files.length} file{section.files.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {section.files.map((file, idx) => (
                        <div key={idx} className="bg-gray-900 rounded p-3">
                          <div className="text-sm text-gray-400 font-mono mb-1">{file.path}</div>
                          {file.line && (
                            <div className="text-xs text-gray-500">Line {file.line}</div>
                          )}
                          {file.current && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-red-400 font-mono">- {file.current}</div>
                              <div className="text-xs text-green-400 font-mono">+ {file.replace}</div>
                            </div>
                          )}
                          {file.description && (
                            <div className="text-xs text-yellow-400 mt-2">{file.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert className="bg-orange-500/20 border-orange-500/50 mt-4">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-sm">
                <strong>Search Command:</strong> Use your code editor to search for "localrnk.com" across all files and replace with <strong>{domain}</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 3: Environment Variables */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="bg-[#c8ff00] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</span>
              Verify Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                <div>
                  <div className="text-white font-semibold">GOOGLE_MAPS_API_KEY</div>
                  <div className="text-xs text-gray-500">Required for business search</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                <div>
                  <div className="text-white font-semibold">ADMIN_ACCESS_KEY</div>
                  <div className="text-xs text-gray-500">Required for admin functions</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            </div>

            <Alert className="bg-green-500/20 border-green-500/50 mt-4">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm">
                All required secrets are configured. No additional environment variables needed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 4: Testing Checklist */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="bg-[#c8ff00] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</span>
              Pre-Launch Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                'Test quiz flow from start to finish on new domain',
                'Verify affiliate redirect works correctly',
                'Check all email links point to new domain',
                'Test campaign click tracking',
                'Verify Google Maps search functionality',
                'Check admin dashboard access',
                'Test analytics tracking (V3 funnel)',
                'Verify mobile responsiveness',
                'Test email delivery and templates',
                'Run health check from Production Checklist page'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded">
                  <div className="w-6 h-6 rounded border-2 border-gray-600 flex items-center justify-center text-xs text-gray-600">
                    {idx + 1}
                  </div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-[#c8ff00]/20 to-green-500/20 border-[#c8ff00]/50">
          <CardContent className="py-8 text-center">
            <Zap className="w-12 h-12 text-[#c8ff00] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Deploy?</h2>
            <p className="text-gray-300 mb-6">
              Once all steps are complete, your app will be live on <strong>{domain}</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-[#c8ff00] text-black hover:bg-[#d4ff33] font-bold">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Run Final Checks
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Base44 Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          Need help? Contact Base44 support or check the documentation
        </div>
      </div>
    </div>
  );
}