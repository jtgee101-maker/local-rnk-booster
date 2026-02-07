import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Clock } from 'lucide-react';

const CHECKLIST_SECTIONS = [
  {
    title: '1. Lead Capture & Initial Nurture',
    description: 'Verify new lead creation triggers welcome email + nurture',
    items: [
      'Create test lead via quiz',
      'Verify welcome email sent',
      'Check email contains business name & health score',
      'Verify Lead record created in database',
      'Verify LeadNurture record with status=active'
    ]
  },
  {
    title: '2. Unconverted Lead Sequence (5 emails over 10 days)',
    description: '24hr, 48hr, 96hr, 168hr, 240hr follow-ups',
    items: [
      'Email 1 (24hrs): "Don\'t lose calls to competitors"',
      'Email 2 (48hrs): "Competitors beating you"',
      'Email 3 (96hrs): "Last chance - discount expires"',
      'Email 4 (168hrs): "Spots reserved - scarcity"',
      'Email 5 (240hrs): "Final email - results recap"',
      'All emails logged in EmailLog table',
      'Verify personalization (business name, health score, revenue)'
    ]
  },
  {
    title: '3. Abandoned Cart Email',
    description: 'Auto-email after 24hrs if lead doesn\'t convert',
    items: [
      'Lead created but no order placed',
      'After 24hrs, abandoned cart email auto-sent',
      'Email includes health score & discount',
      'Email logged with type=abandoned_cart',
      'No duplicate emails same day'
    ]
  },
  {
    title: '4. Post-Conversion Nurture (4 emails over 30 days)',
    description: 'Result tracking & upsell sequence after order',
    items: [
      'Create order for existing lead',
      'LeadNurture record created with sequence_name=post_conversion',
      'Email 1 (2hrs): "Optimization underway"',
      'Email 2 (72hrs): "Partial results showing"',
      'Email 3 (7 days): "Week 1 results - ROI achieved"',
      'Email 4 (14 days): "30-day milestone"',
      'All 4 emails sent in correct intervals'
    ]
  },
  {
    title: '5. Email Delivery & Logging',
    description: 'Verify all emails logged and tracked',
    items: [
      'All emails delivered successfully',
      'EmailLog tracks every email sent',
      'Email status = sent for successful delivery',
      'Email type correctly categorized',
      'Email metadata includes context',
      'Email subjects are personalized & compelling'
    ]
  },
  {
    title: '6. Automation Health',
    description: 'Verify all automations running correctly',
    items: [
      '"Start Nurture for New Leads" active',
      '"Process Lead Nurture Emails" runs every 6 hours',
      '"Send Abandoned Cart Emails" runs daily',
      '"Post-Conversion Nurture" runs every 6 hours',
      'No failed automation runs',
      'All automations show last_run_status = success'
    ]
  },
  {
    title: '7. Lead Status Tracking',
    description: 'Verify lead status pipeline working',
    items: [
      'New leads show status=new',
      'After nurture, can update status manually',
      'Converted leads show status=converted',
      'Lead → LeadNurture → Order relationship correct'
    ]
  },
  {
    title: '8. Performance & Load Testing',
    description: 'Verify system handles volume',
    items: [
      'Nurture queue processes 100+ leads in <30 seconds',
      'Email sending completes in <5 seconds',
      'Database queries optimized',
      'No memory leaks in automation loops'
    ]
  },
  {
    title: '9. Error Handling & Recovery',
    description: 'Verify graceful error handling',
    items: [
      'Invalid email format rejected gracefully',
      'Missing lead data triggers error logging',
      'Failed emails logged with error_message',
      'Retry mechanism for failed emails',
      'Admin notified of critical failures'
    ]
  },
  {
    title: '10. User Experience Testing',
    description: 'Verify email rendering & UX',
    items: [
      'Templates render in Gmail, Outlook, Apple Mail',
      'Mobile responsive on phones',
      'All CTAs working correctly',
      'Images loading correctly',
      'No broken links or placeholder text'
    ]
  },
  {
    title: '11. Data Integrity',
    description: 'Verify no data corruption or duplicates',
    items: [
      'No duplicate emails to same lead',
      'Lead progress tracked correctly',
      'Email counts accurate',
      'Order creation doesn\'t duplicate lead',
      'Referral program works alongside nurture'
    ]
  }
];

export default function TestingChecklistPage() {
  const [checked, setChecked] = useState({});

  const toggleItem = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setChecked(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSectionProgress = (sectionIdx) => {
    const section = CHECKLIST_SECTIONS[sectionIdx];
    const checked_count = section.items.filter((_, itemIdx) => 
      checked[`${sectionIdx}-${itemIdx}`]
    ).length;
    return `${checked_count}/${section.items.length}`;
  };

  const getTotalProgress = () => {
    const total = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    const checked_count = Object.values(checked).filter(Boolean).length;
    return Math.round((checked_count / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Beta Testing Checklist</h1>
          <p className="text-gray-600">Complete validation for nurture sequences before full launch</p>
        </div>

        {/* Progress */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Overall Progress</h3>
              <span className="text-3xl font-bold text-blue-600">{getTotalProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist Sections */}
        <div className="space-y-6">
          {CHECKLIST_SECTIONS.map((section, sectionIdx) => (
            <Card key={sectionIdx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{section.title}</CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {getSectionProgress(sectionIdx)}
                    </div>
                    <div className="text-xs text-gray-500">completed</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <label
                      key={itemIdx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={checked[`${sectionIdx}-${itemIdx}`] || false}
                        onCheckedChange={() => toggleItem(sectionIdx, itemIdx)}
                        className="mt-1"
                      />
                      <span className={checked[`${sectionIdx}-${itemIdx}`] ? 'line-through text-gray-400' : 'text-gray-700'}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Test Flows */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Test Flows (Run These First)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Complete User Journey (5 min)</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to Testing page → Manual Testing tab</li>
                <li>Enter email: test+flow1@example.com</li>
                <li>Click "Create Test Lead"</li>
                <li>Click "Trigger Lead Nurture"</li>
                <li>Click "Check Email Logs" (should see welcome)</li>
                <li>Click "Create Test Order" (simulates conversion)</li>
                <li>Check System Health → verify 2+ emails in pipeline</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Abandoned Cart Test (24+ hours)</h4>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>Create lead (test+abandon@example.com)</li>
                <li>Wait 24 hours OR run "sendAbandonedCartReminders"</li>
                <li>Check email logs for abandoned_cart type</li>
                <li>Verify includes discount & business name</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Post-Conversion Test (instant)</h4>
              <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                <li>Create lead with test email</li>
                <li>Create order for that email</li>
                <li>Run "postConversionNurture"</li>
                <li>Verify LeadNurture created with sequence_name=post_conversion</li>
                <li>Process nurture queue to send first email</li>
                <li>Check System Health → Revenue section</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Go/No-Go Decision */}
        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-6 h-6" />
              Go/No-Go Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-800 space-y-2">
            <p><strong>Ready to Beta (sections 1-7 passing):</strong> Can begin limited user testing</p>
            <p><strong>Ready to Full Launch (all sections passing):</strong> Can open to production traffic</p>
            <p className="text-sm mt-4">Current: {getTotalProgress() >= 70 ? '✅ Sections 1-7 likely passing' : '⏳ Still testing basic flow'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}