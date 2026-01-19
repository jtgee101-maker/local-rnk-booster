import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NurtureSequenceTester from '@/components/testing/NurtureSequenceTester';
import SystemHealthCheck from '@/components/testing/SystemHealthCheck';
import { Database, BarChart3, AlertCircle } from 'lucide-react';

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Testing & Monitoring</h1>
          <p className="text-gray-600">Beta testing dashboard for nurture sequences, automations, and email delivery</p>
        </div>

        {/* Info Banner */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Ready for Beta Testing</h3>
                <p className="text-sm text-blue-800">
                  All automations are active and monitoring leads in real-time. Use the tester below to simulate user journeys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Manual Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <SystemHealthCheck />
          </TabsContent>

          <TabsContent value="tester">
            <NurtureSequenceTester />
          </TabsContent>
        </Tabs>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">System Workflows</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>New Lead Created</strong> → Welcome email sent + nurture sequence started (5 emails over 10 days)</li>
                <li><strong>Lead Abandons Cart</strong> → Auto-detected after 24hrs + abandoned cart email sent (25% discount)</li>
                <li><strong>Lead Converts (Orders)</strong> → Post-conversion nurture started (4 result-tracking emails over 30 days)</li>
                <li><strong>All Emails Logged</strong> → Tracked in EmailLog for debugging and monitoring</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Running Tests</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Go to "Manual Testing" tab</li>
                <li>Enter a test email address (e.g., test+1@example.com)</li>
                <li>Click "Create Test Lead" to start a lead journey</li>
                <li>Run other tests to see the complete workflow</li>
                <li>Check "System Health" tab to see real-time results</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Active Automations</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Start Nurture for New Leads</strong> - Triggers immediately when lead created (entity automation)</li>
                <li><strong>Process Lead Nurture Emails</strong> - Runs every 6 hours to send scheduled emails</li>
                <li><strong>Send Abandoned Cart Emails</strong> - Runs daily to find and email unconverted leads</li>
                <li><strong>Post-Conversion Nurture</strong> - Runs every 6 hours to initialize post-purchase sequences</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Expected Behavior</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Lead created → Immediately starts nurture sequence (first email in 24hrs)</li>
                <li>After 24hrs → First "don't lose calls to competitors" email sent</li>
                <li>After 48hrs → Second "competitors are beating you" email sent</li>
                <li>After 96hrs → Third "last chance" urgency email sent</li>
                <li>After 168hrs → Fourth scarcity email ("spots reserved") sent</li>
                <li>After 240hrs → Final email with results recap</li>
                <li>Order created → Post-conversion nurture starts (results updates over 30 days)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Note:</strong> Automations run on schedule. For immediate testing, use the "Process Nurture Queue" button in the tester tab.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}