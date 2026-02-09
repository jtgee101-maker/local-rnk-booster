import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';

const flows = [
  {
    id: 'audit_submitted_flow',
    name: '📧 Audit Submitted',
    description: 'Lead completes audit, receives confirmation email',
    color: 'blue'
  },
  {
    id: 'pathway_nudge_flow',
    name: '⏰ Pathway Nudge (2h)',
    description: 'Lead hasn\'t selected pathway, gets nudge email',
    color: 'yellow'
  },
  {
    id: 'grant_pathway_flow',
    name: '🏛️ Grant Pathway',
    description: 'Lead selects Gov Tech Grant path',
    color: 'purple'
  },
  {
    id: 'dfy_pathway_flow',
    name: '💼 Done-For-You Path',
    description: 'Lead selects DFY optimization service',
    color: 'green'
  },
  {
    id: 'diy_pathway_flow',
    name: '🎓 DIY Path',
    description: 'Lead selects self-guided DIY program',
    color: 'indigo'
  },
  {
    id: 'checkout_abandoned_flow',
    name: '🛒 Cart Abandoned',
    description: 'Lead starts checkout but abandons it',
    color: 'red'
  },
  {
    id: 'post_purchase_flow',
    name: '🎉 Post-Purchase',
    description: 'Lead completes purchase, gets welcome email',
    color: 'emerald'
  }
];

export default function EmailFlowDemoPanel() {
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});
  const [allRunning, setAllRunning] = useState(false);

  const handleRunTest = async (flowId) => {
    setRunning(flowId);
    try {
      const response = await base44.functions.invoke('nurture/testGeeniusEmailFlow', {
        test_type: flowId
      });

      setResults(prev => ({
        ...prev,
        [flowId]: {
          success: true,
          data: response.data.results[0]
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [flowId]: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setRunning(null);
    }
  };

  const handleRunAll = async () => {
    setAllRunning(true);
    try {
      const response = await base44.functions.invoke('nurture/testGeeniusEmailFlow', {
        test_type: 'run_all'
      });

      const newResults = {};
      response.data.results.forEach(result => {
        newResults[result.test] = { success: true, data: result };
      });
      setResults(newResults);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setAllRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-c8ff00" />
            Email Flow Demonstrations
          </CardTitle>
          <Button
            onClick={handleRunAll}
            disabled={allRunning || running}
            className="bg-c8ff00 text-black hover:bg-yellow-300"
          >
            {allRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run All Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {flows.map(flow => (
            <div key={flow.id} className="border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{flow.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{flow.description}</p>
                  
                  {results[flow.id] && (
                    <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-700">
                      {results[flow.id].success ? (
                        <>
                          <div className="flex items-center gap-2 text-green-400 text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Email sent successfully!
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <p><strong>To:</strong> {results[flow.id].data.lead_email}</p>
                            <p><strong>Resend ID:</strong> {results[flow.id].data.resend_id}</p>
                            <p><strong>Lead ID:</strong> {results[flow.id].data.lead_id}</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          Error: {results[flow.id].error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleRunTest(flow.id)}
                  disabled={running === flow.id || allRunning}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  {running === flow.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>💡 How it works:</strong> Click "Run All Tests" to generate test leads and send each email sequence. 
            Each test creates a unique lead and sends the appropriate email. Check your Resend dashboard or EmailLog 
            entity to see delivery status, open rates, and click tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}