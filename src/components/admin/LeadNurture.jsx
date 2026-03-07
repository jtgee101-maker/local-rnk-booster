import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Clock, CheckCircle, Pause, TrendingUp, Plus } from 'lucide-react';
import NurtureSequenceBuilder from './NurtureSequenceBuilder';

export default function LeadNurture() {
  const [showBuilder, setShowBuilder] = useState(false);
  const { data: nurtures = [] } = useQuery({
    queryKey: ['lead-nurtures'],
    queryFn: () => base44.entities.LeadNurture.list('-created_date', 200),
    refetchInterval: 60000
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-nurture'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
    staleTime: 60000,
  });

  const leadById = React.useMemo(() => 
    leads.reduce((acc, l) => { acc[l.id] = l; return acc; }, {}),
    [leads]
  );

  const activeNurtures = nurtures.filter(n => n.status === 'active');
  const completedNurtures = nurtures.filter(n => n.status === 'completed');
  const convertedNurtures = nurtures.filter(n => n.status === 'converted');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500"><Mail className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'paused':
        return <Badge className="bg-gray-500"><Pause className="w-3 h-3 mr-1" /> Paused</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'converted':
        return <Badge className="bg-purple-500"><TrendingUp className="w-3 h-3 mr-1" /> Converted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalEmailsSent = nurtures.reduce((sum, n) => sum + (n.emails_sent || 0), 0);
  const totalEmailsOpened = nurtures.reduce((sum, n) => sum + (n.emails_opened || 0), 0);
  const openRate = totalEmailsSent > 0 ? ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Active Campaigns</div>
            <div className="text-2xl font-bold text-white">{activeNurtures.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Emails Sent</div>
            <div className="text-2xl font-bold text-blue-400">{totalEmailsSent}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Open Rate</div>
            <div className="text-2xl font-bold text-green-400">{openRate}%</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-gray-400 text-sm mb-1">Converted</div>
            <div className="text-2xl font-bold text-purple-400">{convertedNurtures.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Nurture Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Lead Nurture Campaigns</CardTitle>
            <Button 
              onClick={() => setShowBuilder(true)}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Sequence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Business / Email</TableHead>
                <TableHead className="text-gray-400">Sequence</TableHead>
                <TableHead className="text-gray-400">Progress</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Next Email</TableHead>
                <TableHead className="text-gray-400">Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nurtures.slice(0, 50).map((nurture) => (
                <TableRow key={nurture.id} className="border-gray-700">
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {nurture.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{nurture.sequence_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-400">
                        Step {nurture.current_step}/{nurture.total_steps}
                      </div>
                      <Progress 
                        value={(nurture.current_step / nurture.total_steps) * 100} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(nurture.status)}</TableCell>
                  <TableCell className="text-gray-400">
                    {nurture.next_email_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {new Date(nurture.next_email_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    <div className="text-sm">
                      <div>Sent: {nurture.emails_sent || 0}</div>
                      <div>Opened: {nurture.emails_opened || 0}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NurtureSequenceBuilder
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={() => {
          setShowBuilder(false);
        }}
      />
    </div>
  );
}