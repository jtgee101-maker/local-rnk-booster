import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function NurtureSequenceTester() {
  const [testEmail, setTestEmail] = useState('');
  const [businessName, setBusinessName] = useState('Test Business');
  const [healthScore, setHealthScore] = useState('45');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const tests = [
    {
      name: 'Create Test Lead',
      fn: async () => {
        const lead = await base44.entities.Lead.create({
          email: testEmail,
          business_name: businessName,
          health_score: parseInt(healthScore),
          status: 'new',
          gmb_rating: 3.8,
          gmb_reviews_count: 24
        });
        return { success: true, leadId: lead.id };
      }
    },
    {
      name: 'Send Abandoned Cart Email',
      fn: async () => {
        await base44.functions.invoke('sendAbandonedCartEmail', {
          email: testEmail,
          businessName,
          healthScore: parseInt(healthScore),
          discountPercent: 25
        });
        return { success: true };
      }
    },
    {
      name: 'Trigger Lead Nurture Sequence',
      fn: async () => {
        const leads = await base44.entities.Lead.filter({ email: testEmail });
        if (!leads.length) return { success: false, error: 'Lead not found' };
        
        const result = await base44.functions.invoke('startLeadNurture', {
          leadId: leads[0].id
        });
        return result.data;
      }
    },
    {
      name: 'Process Nurture Queue',
      fn: async () => {
        const result = await base44.functions.invoke('processLeadNurture', {});
        return result.data;
      }
    },
    {
      name: 'Create Test Order & Trigger Post-Conversion',
      fn: async () => {
        const leads = await base44.entities.Lead.filter({ email: testEmail });
        if (!leads.length) return { success: false, error: 'Lead not found' };

        const order = await base44.entities.Order.create({
          lead_id: leads[0].id,
          email: testEmail,
          total_amount: 99,
          status: 'completed'
        });

        const postResult = await base44.functions.invoke('postConversionNurture', {});
        return { success: true, orderId: order.id, ...postResult.data };
      }
    },
    {
      name: 'Check Email Logs',
      fn: async () => {
        const logs = await base44.entities.EmailLog.filter({ to: testEmail });
        return { 
          success: true, 
          emailsSent: logs.length,
          types: logs.map(l => ({ subject: l.subject, status: l.status }))
        };
      }
    }
  ];

  const runTest = async (test) => {
    if (!testEmail) {
      toast.error('Enter a test email address');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const data = await test.fn();
      const duration = Date.now() - startTime;

      setResults(prev => [{
        name: test.name,
        success: data.success !== false,
        data,
        duration,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);

      toast.success(`${test.name} passed!`);
    } catch (error) {
      const duration = Date.now() - startTime;

      setResults(prev => [{
        name: test.name,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);

      toast.error(`${test.name} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Nurture Sequence Tester
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Test all nurture workflows end-to-end</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Email</label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Test Business"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Health Score</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={healthScore}
                onChange={(e) => setHealthScore(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Run Tests:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tests.map((test, idx) => (
                <Button
                  key={idx}
                  onClick={() => runTest(test)}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {test.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Test Results</h3>
        {results.length === 0 ? (
          <p className="text-gray-500 text-sm">Run a test to see results</p>
        ) : (
          results.map((result, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">{result.name}</h4>
                    {result.error && (
                      <p className="text-sm text-red-700 mt-1">{result.error}</p>
                    )}
                    {result.data && (
                      <pre className="text-xs bg-white mt-2 p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{result.duration}ms</div>
                  <div>{result.timestamp}</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}