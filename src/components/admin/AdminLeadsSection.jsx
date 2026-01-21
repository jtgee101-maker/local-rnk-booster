import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';

export default function AdminLeadsSection({ expanded = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['admin-leads-section', expanded],
    queryFn: () => base44.entities.Lead.list('-created_date', expanded ? 200 : 50),
    staleTime: 20000, // 20s cache
    gcTime: 180000, // 3min
  });

  const filteredLeads = leads.filter(lead =>
    !searchTerm ||
    lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async () => {
    const csv = [
      ['Business', 'Email', 'Category', 'Score', 'Status', 'Created'].join(','),
      ...filteredLeads.map(l => [
        l.business_name,
        l.email,
        l.business_category,
        l.health_score,
        l.status,
        new Date(l.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Leads {expanded && `(${leads.length})`}</CardTitle>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        {expanded && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by business or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700"
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Category</TableHead>
                <TableHead className="text-gray-400">Score</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Loading...</TableCell>
                </TableRow>
              ) : filteredLeads.slice(0, expanded ? 50 : 10).map((lead) => (
                <TableRow key={lead.id} className="border-gray-700">
                  <TableCell className="text-white">{lead.business_name || '-'}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{lead.email}</TableCell>
                  <TableCell className="text-gray-400">{lead.business_category?.replace(/_/g, ' ') || '-'}</TableCell>
                  <TableCell>
                    <Badge className={
                      lead.health_score >= 70 ? 'bg-green-500/20 text-green-400' :
                      lead.health_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {lead.health_score}/100
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status || 'new'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}