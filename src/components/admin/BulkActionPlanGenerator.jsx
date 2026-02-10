import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkActionPlanGenerator() {
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setResults(null);
      toast.info('Generating action plans for all leads...');
      
      const response = await base44.functions.invoke('ai/generateAllActionPlans');
      
      setResults(response.data);
      
      if (response.data.failures > 0) {
        toast.warning(`Generated ${response.data.plans_generated} plans with ${response.data.failures} failures`);
      } else {
        toast.success(`Successfully generated ${response.data.plans_generated} action plans!`);
      }
    } catch (error) {
      console.error('Error generating bulk action plans:', error);
      toast.error('Failed to generate action plans');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-gray-700 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Bulk Action Plan Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-400 text-sm">
          Generate AI-powered action plans for all leads that don't have one yet
        </p>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Plans...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Missing Action Plans
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Success</span>
                </div>
                <p className="text-2xl font-bold text-white">{results.plans_generated}</p>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-400">Failed</span>
                </div>
                <p className="text-2xl font-bold text-white">{results.failures}</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>Total leads: {results.total_leads}</p>
              <p>Needed plans: {results.leads_needing_plans}</p>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400 font-semibold mb-2">Errors:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {results.errors.map((err, i) => (
                    <p key={i} className="text-xs text-gray-300">
                      {err.business_name || err.lead_id}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}