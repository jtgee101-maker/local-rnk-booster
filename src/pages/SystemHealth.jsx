import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemHealth() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    const results = [];
    
    try {
      await base44.entities.Lead.list();
      results.push({ name: 'Database', status: 'healthy' });
    } catch (err) {
      results.push({ name: 'Database', status: 'unhealthy' });
    }

    try {
      await base44.entities.EmailLog.list();
      results.push({ name: 'Email System', status: 'healthy' });
    } catch (err) {
      results.push({ name: 'Email System', status: 'unhealthy' });
    }

    try {
      await base44.entities.Order.list();
      results.push({ name: 'Payment System', status: 'healthy' });
    } catch (err) {
      results.push({ name: 'Payment System', status: 'unhealthy' });
    }

    setChecks(results);
    setLoading(false);
    toast.success('Health check complete');
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#c8ff00]" />
            System Health
          </h1>
          <Button onClick={runCheck} disabled={loading} className="bg-[#c8ff00] text-black">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
        </div>

        <div className="space-y-4">
          {checks.map((check, idx) => (
            <Card key={idx} className="bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{check.name}</CardTitle>
                  <Badge className={check.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                    {check.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    {check.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}