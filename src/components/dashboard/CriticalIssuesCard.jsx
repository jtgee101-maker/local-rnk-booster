import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function CriticalIssuesCard({ issues }) {
  if (!issues || issues.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">No critical issues found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Critical Issues ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{issue}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}