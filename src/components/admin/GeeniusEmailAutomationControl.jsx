import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';

export default function GeeniusEmailAutomationControl() {
  const [emailLogs, setEmailLogs] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [stats, setStats] = useState({
    total_sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logs, autos] = await Promise.all([
        base44.entities.EmailLog.filter({
          type: 'nurture'
        }).then(r => r.slice(0, 20)),
        base44.entities.LeadNurture.filter({
          status: 'active'
        })
      ]);

      setEmailLogs(logs);
      setAutomations(autos);

      // Calculate stats
      const stats = {
        total_sent: logs.length,
        delivered: logs.filter(l => l.status === 'sent').length,
        opened: logs.filter(l => l.open_count > 0).length,
        clicked: logs.filter(l => l.click_count > 0).length,
        failed: logs.filter(l => l.status === 'failed').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    
    setTesting(true);
    try {
      const response = await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id: 'test-lead-123',
        sequence_key: 'audit_submitted'
      });

      if (response.data.success) {
        alert('✓ Test email sent! Check the email logs below.');
        await fetchData();
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleRunSequence = async (lead_id, sequence_key) => {
    try {
      await base44.functions.invoke('nurture/geeniusEmailSequences', {
        lead_id,
        sequence_key
      });
      alert('✓ Email sent successfully!');
      await fetchData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-c8ff00">{stats.total_sent}</div>
            <div className="text-xs text-gray-500 mt-1">Emails Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">{stats.delivered}</div>
            <div className="text-xs text-gray-500 mt-1">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-500">{stats.opened}</div>
            <div className="text-xs text-gray-500 mt-1">Opened</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-500">{stats.clicked}</div>
            <div className="text-xs text-gray-500 mt-1">Clicked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs text-gray-500 mt-1">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-c8ff00" />
            Test Automation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
            />
            <Button
              onClick={handleTestEmail}
              disabled={!testEmail || testing}
              className="bg-c8ff00 text-black hover:bg-yellow-300"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-c8ff00" />
            Recent Email Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {emailLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No emails sent yet</p>
            ) : (
              emailLogs.map((log) => (
                <div key={log.id} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{log.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">{log.to}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {log.metadata?.sequence_key || 'nurture'}
                        </Badge>
                        {log.open_count > 0 && (
                          <Badge className="bg-blue-900 text-blue-100 text-xs">
                            Opened {log.open_count}x
                          </Badge>
                        )}
                        {log.click_count > 0 && (
                          <Badge className="bg-purple-900 text-purple-100 text-xs">
                            Clicked {log.click_count}x
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : log.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Mail className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(log.created_date).toLocaleDateString()} {new Date(log.created_date).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-c8ff00" />
            Active Nurture Sequences ({automations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {automations.length === 0 ? (
              <p className="text-gray-500 text-sm">No active sequences</p>
            ) : (
              automations.map((auto) => (
                <div key={auto.id} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{auto.sequence_name}</p>
                      <p className="text-xs text-gray-400">
                        Step {auto.current_step}/{auto.total_steps} • {auto.emails_sent} emails sent
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{auto.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {auto.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}