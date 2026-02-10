import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function APILogs() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = '/QuizGeenius';
          return;
        }
        setUser(currentUser);
        loadLogs();
      } catch (err) {
        window.location.href = '/QuizGeenius';
      }
    };
    checkAuth();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const errorLogs = await base44.entities.ErrorLog.list('-created_date', 20);
      setLogs(errorLogs.map(log => ({
        id: log.id,
        message: log.message,
        severity: log.severity,
        timestamp: new Date(log.created_date).toLocaleString()
      })));
    } catch (err) {
      toast.error('Failed to load logs');
    }
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#c8ff00]" />
            API Logs
          </h1>
          <Button onClick={loadLogs} className="bg-[#c8ff00] text-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.id} className="bg-[#1a1a2e] border-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base font-normal text-white mb-2">
                      {log.message}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {log.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
          
          {logs.length === 0 && (
            <Card className="bg-[#1a1a2e] border-gray-800">
              <CardContent className="py-12 text-center text-gray-400">
                No logs found
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}