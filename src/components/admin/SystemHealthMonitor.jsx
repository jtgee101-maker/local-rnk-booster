import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, RotateCw, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SystemHealthMonitor() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRunTime, setLastRunTime] = useState(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('runFunnelTests', {});
      setTestResults(response.data);
      setLastRunTime(new Date().toLocaleString());
      
      if (response.data.success) {
        toast.success(`✅ Tests complete: ${response.data.summary.passed}/${response.data.summary.total} passed`);
      } else {
        toast.error('⚠️ Some tests failed. Check results below.');
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      toast.error('Failed to run tests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-500/10 border-green-500/30';
      case 'FAIL':
        return 'bg-red-500/10 border-red-500/30';
      case 'WARN':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-gray-900/30 border-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Health Monitor</h2>
        <Button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 mr-2" />
              Run Comprehensive Tests
            </>
          )}
        </Button>
      </div>

      {lastRunTime && (
        <div className="text-sm text-gray-400">
          Last run: {lastRunTime}
        </div>
      )}

      {testResults && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-white">{testResults.summary.total}</div>
              <div className="text-sm text-gray-400">Total Tests</div>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{testResults.summary.passed}</div>
              <div className="text-sm text-gray-400">Passed</div>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{testResults.summary.failed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div className={`p-4 rounded-lg ${
              testResults.summary.passed === testResults.summary.total
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-yellow-500/10 border border-yellow-500/30'
            }`}>
              <div className="text-2xl font-bold">{testResults.summary.passRate}</div>
              <div className="text-sm text-gray-400">Pass Rate</div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Test Results</h3>
            {testResults.testsRun.map((test, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 border rounded-lg flex items-start gap-3 ${getStatusColor(test.status)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{test.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{test.details}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Issues Found */}
          {testResults.issuesFound && testResults.issuesFound.length > 0 && (
            <div className="space-y-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">Issues Found</h3>
              </div>
              <ul className="space-y-2">
                {testResults.issuesFound.map((issue, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="font-semibold text-red-400">{issue.type}:</span> {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {!testResults && !loading && (
        <div className="text-center py-12 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Run Comprehensive Tests" to start testing the funnel</p>
        </div>
      )}
    </div>
  );
}