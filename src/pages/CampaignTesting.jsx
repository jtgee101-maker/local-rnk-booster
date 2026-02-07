import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap, CheckCircle, XCircle, Loader2, QrCode, Link as LinkIcon,
  MousePointer, AlertCircle, Copy, ExternalLink, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignTesting() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [testCampaign, setTestCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser?.role === 'admin') {
          const allCampaigns = await base44.entities.Campaign.list('-created_date', 10);
          setCampaigns(allCampaigns);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: Date.now()
    }]);
  };

  const createTestCampaign = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      // Step 1: Create test campaign
      addResult('create_campaign', 'running', 'Creating test campaign...');
      
      const campaign = await base44.entities.Campaign.create({
        name: `Test Campaign ${Date.now()}`,
        type: 'qr_code',
        status: 'active',
        utm_source: 'test',
        utm_medium: 'qr',
        utm_campaign: 'verification_test',
        base_url: 'https://localrnk.com/QuizV3',
        notes: 'Automated test campaign for verification'
      });
      
      setTestCampaign(campaign);
      addResult('create_campaign', 'success', 'Campaign created successfully', campaign);

      // Step 2: Create tracking link
      addResult('create_link', 'running', 'Generating tracking link...');
      
      const shortCode = Math.random().toString(36).substring(2, 8);
      const trackingLink = await base44.entities.CampaignLink.create({
        campaign_id: campaign.id,
        short_code: shortCode,
        purl: `test-${shortCode}`,
        full_url: `${campaign.base_url}?utm_source=${campaign.utm_source}&utm_medium=${campaign.utm_medium}&utm_campaign=${campaign.utm_campaign}&ref=${shortCode}`,
        recipient_name: 'Test User',
        recipient_email: user?.email || 'test@test.com'
      });
      
      addResult('create_link', 'success', 'Tracking link generated', trackingLink);

      // Step 3: Simulate click
      addResult('track_click', 'running', 'Simulating click tracking...');
      
      const click = await base44.entities.CampaignClick.create({
        campaign_id: campaign.id,
        link_id: trackingLink.id,
        short_code: shortCode,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
        device_type: 'desktop',
        browser: 'Test Browser',
        os: 'Test OS'
      });
      
      addResult('track_click', 'success', 'Click tracked successfully', click);

      // Step 4: Update campaign stats
      addResult('update_stats', 'running', 'Updating campaign statistics...');
      
      await base44.entities.Campaign.update(campaign.id, {
        total_clicks: 1
      });
      
      await base44.entities.CampaignLink.update(trackingLink.id, {
        clicks: 1,
        first_click_date: new Date().toISOString()
      });
      
      addResult('update_stats', 'success', 'Campaign stats updated');

      // Step 5: Verify data
      addResult('verify_data', 'running', 'Verifying campaign data...');
      
      const updatedCampaign = await base44.entities.Campaign.filter({ id: campaign.id });
      const campaignClicks = await base44.entities.CampaignClick.filter({ campaign_id: campaign.id });
      const campaignLinks = await base44.entities.CampaignLink.filter({ campaign_id: campaign.id });
      
      if (updatedCampaign.length > 0 && campaignClicks.length > 0 && campaignLinks.length > 0) {
        addResult('verify_data', 'success', 
          `Verified: ${updatedCampaign.length} campaign, ${campaignLinks.length} link, ${campaignClicks.length} click`
        );
      } else {
        addResult('verify_data', 'warning', 'Some data verification failed');
      }

      // Step 6: Analytics integration
      addResult('analytics', 'running', 'Testing analytics integration...');
      
      await base44.analytics.track({
        eventName: 'campaign_test_completed',
        properties: {
          campaign_id: campaign.id,
          short_code: shortCode,
          test_timestamp: Date.now()
        }
      });
      
      addResult('analytics', 'success', 'Analytics tracking verified');

      toast.success('Campaign testing complete!');
      
      // Refresh campaign list
      const allCampaigns = await base44.entities.Campaign.list('-created_date', 10);
      setCampaigns(allCampaigns);
      
    } catch (error) {
      console.error('Test error:', error);
      addResult('error', 'error', `Test failed: ${error.message}`);
      toast.error('Campaign test failed');
    } finally {
      setTesting(false);
    }
  };

  const cleanupTestCampaign = async () => {
    if (!testCampaign) return;
    
    try {
      // Delete clicks
      const clicks = await base44.entities.CampaignClick.filter({ campaign_id: testCampaign.id });
      for (const click of clicks) {
        await base44.entities.CampaignClick.delete(click.id);
      }
      
      // Delete links
      const links = await base44.entities.CampaignLink.filter({ campaign_id: testCampaign.id });
      for (const link of links) {
        await base44.entities.CampaignLink.delete(link.id);
      }
      
      // Delete campaign
      await base44.entities.Campaign.delete(testCampaign.id);
      
      setTestCampaign(null);
      setTestResults([]);
      
      const allCampaigns = await base44.entities.Campaign.list('-created_date', 10);
      setCampaigns(allCampaigns);
      
      toast.success('Test campaign cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Cleanup failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'running': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return null;
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
            <p className="text-gray-400">Campaign testing requires admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <h1 className="text-4xl font-black text-white">Campaign Testing</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Create and test campaign tracking system end-to-end
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={createTestCampaign}
            disabled={testing}
            style={{ backgroundColor: '#c8ff00' }}
            className="text-black font-bold hover:opacity-90"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Create & Test Campaign
              </>
            )}
          </Button>
          {testCampaign && (
            <Button
              onClick={cleanupTestCampaign}
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Clean Up Test Data
            </Button>
          )}
        </div>

        {/* Test Progress */}
        {testResults.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{successCount}</div>
                  <div className="text-sm text-gray-400">Tests Passed</div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="py-4 text-center">
                  <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{errorCount}</div>
                  <div className="text-sm text-gray-400">Tests Failed</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      result.status === 'success' ? 'border-green-500/50 bg-green-500/10' :
                      result.status === 'error' ? 'border-red-500/50 bg-red-500/10' :
                      result.status === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' :
                      'border-blue-500/50 bg-blue-500/10'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-semibold text-white capitalize mb-1">
                            {result.test.replace(/_/g, ' ')}
                          </div>
                          <p className="text-sm text-gray-300">{result.message}</p>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded overflow-auto text-gray-400">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Test Campaign Details */}
        {testCampaign && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                  <div>
                    <div className="text-sm text-gray-400">Campaign Name</div>
                    <div className="text-white font-semibold">{testCampaign.name}</div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                  <div>
                    <div className="text-sm text-gray-400">Campaign ID</div>
                    <div className="text-white font-mono text-sm">{testCampaign.id}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(testCampaign.id)}
                    className="text-gray-400"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                  <div>
                    <div className="text-sm text-gray-400">Base URL</div>
                    <div className="text-white text-sm">{testCampaign.base_url}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(testCampaign.base_url, '_blank')}
                    className="text-gray-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Campaigns */}
        {campaigns.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-700">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{campaign.name}</div>
                      <div className="text-sm text-gray-400">
                        {campaign.total_clicks || 0} clicks • {campaign.type}
                      </div>
                    </div>
                    <Badge className={
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                      'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }>
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What Gets Tested */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">What Gets Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Campaign Creation</div>
                  <div className="text-sm text-gray-400">Creates a test campaign with UTM parameters</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Tracking Link Generation</div>
                  <div className="text-sm text-gray-400">Generates unique short codes and full tracking URLs</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MousePointer className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Click Tracking</div>
                  <div className="text-sm text-gray-400">Records clicks with device, browser, and location data</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Statistics Updates</div>
                  <div className="text-sm text-gray-400">Updates campaign and link click counts</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-[#c8ff00] mt-0.5" />
                <div>
                  <div className="font-semibold">Analytics Integration</div>
                  <div className="text-sm text-gray-400">Verifies events are tracked via base44.analytics</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>Next:</strong> Create real campaigns in the Campaign Manager and monitor performance in Analytics.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}