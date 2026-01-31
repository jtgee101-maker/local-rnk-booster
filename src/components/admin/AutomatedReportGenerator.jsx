import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Calendar, TrendingUp, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedReportGenerator() {
  const [reportType, setReportType] = useState('weekly');
  const [generating, setGenerating] = useState(false);

  const { data: reportData } = useQuery({
    queryKey: ['report-data', reportType],
    queryFn: async () => {
      const [leads, orders, emails] = await Promise.all([
        base44.entities.Lead.list('-created_date', 100),
        base44.entities.Order.list('-created_date', 100),
        base44.entities.EmailLog.list('-created_date', 200)
      ]);

      const completedOrders = orders.filter(o => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

      return {
        leads: leads.length,
        orders: completedOrders.length,
        revenue: totalRevenue,
        conversionRate: leads.length > 0 ? (completedOrders.length / leads.length * 100).toFixed(1) : 0,
        emailsSent: emails.length,
        emailOpenRate: emails.length > 0 ? (emails.filter(e => e.open_count > 0).length / emails.length * 100).toFixed(1) : 0
      };
    }
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      // In production, this would call a backend function to generate PDF/CSV
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create CSV
      const csv = [
        ['Metric', 'Value'],
        ['Total Leads', reportData.leads],
        ['Total Orders', reportData.orders],
        ['Total Revenue', `$${reportData.revenue}`],
        ['Conversion Rate', `${reportData.conversionRate}%`],
        ['Emails Sent', reportData.emailsSent],
        ['Email Open Rate', `${reportData.emailOpenRate}%`]
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Summary', icon: Calendar },
    { value: 'weekly', label: 'Weekly Report', icon: TrendingUp },
    { value: 'monthly', label: 'Monthly Report', icon: FileText },
    { value: 'custom', label: 'Custom Range', icon: Calendar }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c8ff00]" />
            Automated Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={generateReport}
              disabled={generating}
              className="bg-[#c8ff00] text-black hover:bg-[#b8ef00]"
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Total Leads</div>
              <div className="text-white text-2xl font-bold">{reportData?.leads}</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Orders</div>
              <div className="text-white text-2xl font-bold">{reportData?.orders}</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Revenue</div>
              <div className="text-white text-2xl font-bold">${reportData?.revenue}</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Conv Rate</div>
              <div className="text-white text-2xl font-bold">{reportData?.conversionRate}%</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Emails Sent</div>
              <div className="text-white text-2xl font-bold">{reportData?.emailsSent}</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Open Rate</div>
              <div className="text-white text-2xl font-bold">{reportData?.emailOpenRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}