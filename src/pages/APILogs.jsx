import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const colors = {
  brand: { DEFAULT: '#c8ff00', foreground: '#0a0a0f' }
};

export default function APILogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      // Load error logs as a proxy for API logs
      const errorLogs = await base44.entities.ErrorLog.filter({}, '-created_date', 50);
      setLogs(errorLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (severity) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'high': 
      case 'critical': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-400">Loading API logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Terminal className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">API & System Logs</h1>
              <p className="text-sm text-gray-400">Recent system activity and errors</p>
            </div>
          </div>
          <Button
            onClick={loadLogs}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="py-12 text-center">
                <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No logs found</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(log.severity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getSeverityColor(log.severity)}`}>
                            {log.severity?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                            {log.error_type}
                          </Badge>
                          {log.resolved && (
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-white text-sm mb-2">{log.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(log.created_date).toLocaleString()}</span>
                          {log.metadata?.component && (
                            <span>Component: {log.metadata.component}</span>
                          )}
                        </div>
                        
                        {log.stack_trace && (
                          <details className="mt-3">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-800/50 rounded text-xs text-gray-400 overflow-x-auto">
                              {log.stack_trace}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}