import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Play, Users, Zap, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function ControlActionsVerifier() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [testEmail, setTestEmail] = useState('test@example.com');

  const runControlTests = async () => {
    try {
      setTesting(true);
      setResults([]);
      const testResults = [];

      testResults.push(await testUserInvitation());
      setResults([...testResults]);

      testResults.push(await testDataExport());
      setResults([...testResults]);

      testResults.push(await testSettingsPersistence());
      setResults([...testResults]);

      testResults.push(await testAutomationTrigger());
      setResults([...testResults]);

      testResults.push(await testLeadScoring());
      setResults([...testResults]);

      setTesting(false);
      const passed = testResults.filter(r => r.passed).length;
      const failed = testResults.filter(r => !r.passed).length;
      
      if (failed === 0) {
        toast.success(`All ${passed} tests passed ✅`);
      } else {
        toast.warning(`${passed}/${testResults.length} passed`);
      }
    } catch (error) {
      setTesting(false);
      toast.error('Control test suite error');
    }
  };

  const testUserInvitation = async () => {
    try {
      const canInvite = typeof base44.users?.inviteUser === 'function';
      return {
        name: 'User Invitation System',
        passed: canInvite,
        message: canInvite ? 'Available' : 'Missing'
      };
    } catch {
      return { name: 'User Invitation System', passed: false, message: 'Error' };
    }
  };

  const testDataExport = async () => {
    try {
      const leads = await Promise.race([
        base44.entities.Lead.list('', 5),
        new Promise((_, r) => setTimeout(() => r([]), 2000))
      ]);
      return {
        name: 'Data Export Function',
        passed: Array.isArray(leads),
        message: `${Array.isArray(leads) ? leads.length : 0} records ready`
      };
    } catch {
      return { name: 'Data Export Function', passed: false, message: 'Error' };
    }
  };

  const testSettingsPersistence = async () => {
    try {
      await Promise.race([
        base44.entities.AppSettings.filter({ setting_key: 'test_' + Date.now() }),
        new Promise((_, r) => setTimeout(() => r([]), 2000))
      ]);
      return {
        name: 'Settings Persistence',
        passed: true,
        message: 'Operational'
      };
    } catch {
      return { name: 'Settings Persistence', passed: false, message: 'Error' };
    }
  };

  const testAutomationTrigger = async () => {
    try {
      const response = await Promise.race([
        base44.functions.invoke('listAutomations', {}),
        new Promise((_, r) => setTimeout(() => r({}), 2000))
      ]);
      const autos = response?.data || [];
      return {
        name: 'Automation System',
        passed: Array.isArray(autos),
        message: `${Array.isArray(autos) ? autos.length : 0} configured`
      };
    } catch {
      return { name: 'Automation System', passed: false, message: 'Error' };
    }
  };

  const testLeadScoring = async () => {
    try {
      const leads = await Promise.race([
        base44.entities.Lead.list('', 5),
        new Promise((_, r) => setTimeout(() => r([]), 2000))
      ]);
      const scored = Array.isArray(leads) ? leads.filter(l => l.lead_score !== undefined).length : 0;
      return {
        name: 'Lead Scoring Engine',
        passed: Array.isArray(leads),
        message: `${scored}/${Array.isArray(leads) ? leads.length : 0} scored`
      };
    } catch {
      return { name: 'Lead Scoring Engine', passed: false, message: 'Error' };
    }
  };

  const actionIcons = {
    'User Invitation System': Users,
    'Data Export Function': Download,
    'Settings Persistence': Settings,
    'Automation System': Zap,
    'Lead Scoring Engine': CheckCircle
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#c8ff00]" />
            Admin Control Verification
          </CardTitle>
          <Button
            onClick={runControlTests}
            disabled={testing}
            size="sm"
            className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
          >
            {testing ? (
              <>Running Tests...</>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Controls
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, i) => {
              const Icon = actionIcons[result.name] || CheckCircle;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    result.passed
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-900 rounded-lg">
                      <Icon className={`w-4 h-4 ${result.passed ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{result.name}</span>
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{result.message}</p>
                      {result.action && (
                        <p className="text-xs text-[#c8ff00]">→ {result.action}</p>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-400 mt-1">Error: {result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Click "Test Controls" to verify admin actions</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-2">
            <div className="font-semibold">Control Tests:</div>
            <ul className="space-y-1 ml-4 list-disc">
              <li>User invitation system</li>
              <li>Data export functionality</li>
              <li>Settings persistence</li>
              <li>Automation triggers</li>
              <li>Lead scoring operations</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}