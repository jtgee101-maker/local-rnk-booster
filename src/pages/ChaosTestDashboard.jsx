import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Zap, TrendingUp, CheckCircle2, Clock, AlertCircle, Play, StopCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ChaosTestDashboard() {
  const [testRunning, setTestRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('latency');
  const [intensity, setIntensity] = useState('medium');
  const [duration, setDuration] = useState(60);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const chaosTests = [
    {
      id: 'latency',
      name: 'Network Latency Injection',
      description: 'Add artificial network delays to all requests',
      icon: '⏱️',
      defaultIntensity: 'medium',
      metrics: ['Response Time', 'Throughput', 'Error Rate']
    },
    {
      id: 'error-injection',
      name: 'Random Error Injection',
      description: 'Randomly fail requests to test error handling',
      icon: '❌',
      defaultIntensity: 'medium',
      metrics: ['Error Count', 'Recovery Time', 'Client Behavior']
    },
    {
      id: 'database-failure',
      name: 'Database Connection Failure',
      description: 'Simulate database unavailability',
      icon: '🗄️',
      defaultIntensity: 'high',
      metrics: ['Connection Timeouts', 'Failover Time', 'Data Consistency']
    },
    {
      id: 'memory-pressure',
      name: 'Memory Pressure Test',
      description: 'Gradually increase memory usage to test limits',
      icon: '💾',
      defaultIntensity: 'medium',
      metrics: ['Memory Usage', 'GC Pauses', 'Stability']
    },
    {
      id: 'service-degradation',
      name: 'Service Degradation',
      description: 'Slowly reduce service capacity',
      icon: '📉',
      defaultIntensity: 'low',
      metrics: ['Latency Impact', 'Queue Depth', 'Recovery']
    },
    {
      id: 'network-partition',
      name: 'Network Partition',
      description: 'Simulate network split between services',
      icon: '🔌',
      defaultIntensity: 'high',
      metrics: ['Partition Tolerance', 'Data Loss', 'Consistency']
    }
  ];

  const intensityLevels = {
    low: { value: 'low', label: 'Low', color: 'text-blue-600' },
    medium: { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    high: { value: 'high', label: 'High', color: 'text-red-600' }
  };

  const handleStartTest = async () => {
    if (!selectedTest) {
      toast.error('Please select a test');
      return;
    }

    setTestRunning(true);
    setLoading(true);

    try {
      toast.info(`Starting ${selectedTest} test...`);
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      
      // Generate mock results
      const mockResult = {
        id: Date.now(),
        testName: chaosTests.find(t => t.id === selectedTest)?.name,
        intensity,
        duration,
        startTime: new Date(),
        status: Math.random() > 0.1 ? 'passed' : 'failed',
        metrics: {
          responseTime: Math.random() * 500 + 50,
          errorRate: Math.random() * 5,
          throughput: Math.random() * 1000 + 500,
          recoveryTime: Math.random() * 10 + 1
        }
      };

      setResults(prev => [mockResult, ...prev]);
      toast.success('Test completed successfully!');
    } catch (error) {
      toast.error('Test execution failed');
    } finally {
      setTestRunning(false);
      setLoading(false);
    }
  };

  const handleStopTest = () => {
    setTestRunning(false);
    toast.info('Test stopped');
  };

  const currentTest = chaosTests.find(t => t.id === selectedTest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-900/30 p-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-4xl font-bold text-white">Chaos Engineering Lab</h1>
            </div>
            <p className="text-gray-300 text-lg">Test system resilience under failure scenarios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Configuration */}
          <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Test Control
              </CardTitle>
              <CardDescription className="text-gray-400">Configure and launch chaos tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Selection */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Select Test</label>
                <Select value={selectedTest} onValueChange={setSelectedTest} disabled={testRunning}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chaosTests.map(test => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.icon} {test.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Intensity */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Intensity</label>
                <Select value={intensity} onValueChange={setIntensity} disabled={testRunning}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(intensityLevels).map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Duration (seconds)</label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={testRunning}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-4">
                {!testRunning ? (
                  <Button
                    onClick={handleStartTest}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Test
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTest}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Test
                  </Button>
                )}
              </div>

              {testRunning && (
                <div className="p-3 bg-orange-900/30 border border-orange-700/50 rounded-lg text-center">
                  <div className="animate-pulse text-orange-400 text-sm font-medium">
                    ⚠️ Test in progress...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Details */}
          <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{currentTest?.icon} {currentTest?.name}</CardTitle>
              <CardDescription className="text-gray-400">{currentTest?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metrics */}
              <div>
                <h4 className="text-white font-semibold mb-3">Test Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentTest?.metrics.map((metric, i) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-gray-400 text-sm">{metric}</p>
                      <p className="text-white font-semibold mt-1">—</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Impact */}
              <div>
                <h4 className="text-white font-semibold mb-3">Expected Impact</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• ⚠️ Temporary service degradation expected</li>
                  <li>• 📊 Monitor error rates and latency spikes</li>
                  <li>• ✓ System should recover gracefully</li>
                  <li>• 🔄 No permanent data loss expected</li>
                </ul>
              </div>

              {/* Status */}
              {testRunning && (
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-white font-medium">Test in progress</p>
                    <p className="text-blue-300 text-sm">Duration: {duration}s</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Test Results</CardTitle>
              <Badge variant="outline" className="text-gray-300">{results.length} tests</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No test results yet. Run a test to see results here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map(result => (
                  <div key={result.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{result.testName}</h4>
                        <p className="text-gray-400 text-sm">
                          {result.startTime.toLocaleString()} • {result.duration}s duration
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={result.status === 'passed' ? 'bg-green-600' : 'bg-red-600'}>
                          {result.status === 'passed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                          {result.status}
                        </Badge>
                        <Badge variant="outline" className="text-gray-300">
                          {result.intensity}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-sm">
                        <p className="text-gray-400">Response Time</p>
                        <p className="text-white font-semibold">{result.metrics.responseTime.toFixed(0)}ms</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-400">Error Rate</p>
                        <p className="text-white font-semibold">{result.metrics.errorRate.toFixed(2)}%</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-400">Throughput</p>
                        <p className="text-white font-semibold">{result.metrics.throughput.toFixed(0)} req/s</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-400">Recovery Time</p>
                        <p className="text-white font-semibold">{result.metrics.recoveryTime.toFixed(1)}s</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Library */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Available Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chaosTests.map(test => (
                <div
                  key={test.id}
                  onClick={() => !testRunning && setSelectedTest(test.id)}
                  className={`p-4 rounded-lg border transition cursor-pointer ${
                    selectedTest === test.id
                      ? 'bg-gray-700 border-yellow-500'
                      : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                  } ${testRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-2">{test.icon}</div>
                  <h4 className="text-white font-semibold text-sm">{test.name}</h4>
                  <p className="text-gray-400 text-xs mt-1">{test.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}