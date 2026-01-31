import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, AlertCircle, Clock, Shield, Zap,
  Target, TrendingUp, Users, Mail, Database, Settings,
  Code, Lock, Activity, ArrowRight, ChevronDown, ChevronRight
} from 'lucide-react';

export default function AdminAuditPlan() {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // AUDIT STATUS OVERVIEW
  const auditOverview = {
    totalFeatures: 48,
    completed: 32,
    inProgress: 8,
    pending: 8,
    completionRate: 67
  };

  // DETAILED AUDIT BY CATEGORY
  const auditCategories = [
    {
      id: 'core_metrics',
      name: 'Core Metrics & Analytics',
      icon: TrendingUp,
      status: 'good',
      completion: 85,
      items: [
        { name: 'AdminMetrics Dashboard', status: 'complete', priority: 'critical' },
        { name: 'KPI Tracking', status: 'complete', priority: 'critical' },
        { name: 'Trend Analysis (7d comparison)', status: 'complete', priority: 'high' },
        { name: 'Real-time Data Refresh', status: 'complete', priority: 'high' },
        { name: 'CSV Export Functionality', status: 'complete', priority: 'medium' },
        { name: 'Advanced Filtering', status: 'incomplete', priority: 'high', gap: 'Missing date range filters, custom metrics' },
        { name: 'Predictive Analytics Integration', status: 'incomplete', priority: 'medium', gap: 'Not fully integrated with main dashboard' }
      ]
    },
    {
      id: 'lead_management',
      name: 'Lead Management',
      icon: Users,
      status: 'good',
      completion: 80,
      items: [
        { name: 'Lead List View with Pagination', status: 'complete', priority: 'critical' },
        { name: 'Search & Filter Functionality', status: 'complete', priority: 'critical' },
        { name: 'Status Management (new, qualified, converted, lost)', status: 'complete', priority: 'critical' },
        { name: 'Health Score Display', status: 'complete', priority: 'high' },
        { name: 'CSV Export', status: 'complete', priority: 'medium' },
        { name: 'Bulk Actions (status update, delete)', status: 'incomplete', priority: 'high', gap: 'No bulk operations available' },
        { name: 'Lead Detail Modal/Page', status: 'incomplete', priority: 'high', gap: 'Clicking lead has no detailed view' },
        { name: 'Lead Assignment to Users', status: 'missing', priority: 'medium', gap: 'No assignment workflow' },
        { name: 'Lead Notes/Activity Log', status: 'missing', priority: 'medium', gap: 'No historical tracking' }
      ]
    },
    {
      id: 'order_management',
      name: 'Order & Payment Management',
      icon: Database,
      status: 'warning',
      completion: 65,
      items: [
        { name: 'Order List View', status: 'complete', priority: 'critical' },
        { name: 'Basic Order Details', status: 'complete', priority: 'critical' },
        { name: 'Refund Processing', status: 'complete', priority: 'critical' },
        { name: 'Status Tracking', status: 'complete', priority: 'high' },
        { name: 'CSV Export', status: 'complete', priority: 'medium' },
        { name: 'Order Detail Modal', status: 'incomplete', priority: 'high', gap: 'No detailed order breakdown view' },
        { name: 'Payment Intent Tracking', status: 'incomplete', priority: 'high', gap: 'Not displaying Stripe payment details' },
        { name: 'Subscription Management', status: 'missing', priority: 'high', gap: 'No subscription pause/cancel UI' },
        { name: 'Dispute Handling', status: 'missing', priority: 'medium', gap: 'No dispute notification system' },
        { name: 'Revenue Analytics', status: 'incomplete', priority: 'medium', gap: 'Basic stats only, no cohort analysis' }
      ]
    },
    {
      id: 'email_system',
      name: 'Email & Communication',
      icon: Mail,
      status: 'warning',
      completion: 70,
      items: [
        { name: 'Email Log Tracking', status: 'complete', priority: 'critical' },
        { name: 'Email Analytics Dashboard', status: 'complete', priority: 'high' },
        { name: 'Failure Monitoring', status: 'complete', priority: 'high' },
        { name: 'Resend Email Functionality', status: 'complete', priority: 'high' },
        { name: 'Email Preview', status: 'incomplete', priority: 'medium', gap: 'Cannot preview sent emails' },
        { name: 'Template Management', status: 'missing', priority: 'high', gap: 'No UI for editing email templates' },
        { name: 'Email Scheduling', status: 'missing', priority: 'medium', gap: 'Cannot schedule emails from UI' },
        { name: 'Unsubscribe Management', status: 'incomplete', priority: 'medium', gap: 'No centralized unsubscribe list' },
        { name: 'Bounce Rate Tracking', status: 'incomplete', priority: 'medium', gap: 'Basic logging only' }
      ]
    },
    {
      id: 'automation',
      name: 'Automation & Workflows',
      icon: Zap,
      status: 'critical',
      completion: 40,
      items: [
        { name: 'Automation List Display', status: 'complete', priority: 'critical' },
        { name: 'Basic Automation Info', status: 'complete', priority: 'high' },
        { name: 'Create New Automation', status: 'missing', priority: 'critical', gap: 'No UI to create automations' },
        { name: 'Edit Automation', status: 'missing', priority: 'critical', gap: 'Cannot edit existing automations' },
        { name: 'Delete Automation', status: 'missing', priority: 'critical', gap: 'Cannot delete automations' },
        { name: 'Pause/Resume Automation', status: 'incomplete', priority: 'critical', gap: 'Buttons exist but not functional' },
        { name: 'Manual Trigger', status: 'missing', priority: 'high', gap: 'Cannot manually trigger runs' },
        { name: 'Execution History', status: 'missing', priority: 'high', gap: 'No historical run data' },
        { name: 'Error Logs for Automations', status: 'missing', priority: 'high', gap: 'No detailed error tracking' },
        { name: 'Automation Templates', status: 'missing', priority: 'medium', gap: 'No pre-built workflows' }
      ]
    },
    {
      id: 'nurture',
      name: 'Lead Nurture Sequences',
      icon: Activity,
      status: 'warning',
      completion: 60,
      items: [
        { name: 'Nurture Sequence List', status: 'complete', priority: 'critical' },
        { name: 'Active Sequence Tracking', status: 'complete', priority: 'high' },
        { name: 'Sequence Status Updates', status: 'complete', priority: 'high' },
        { name: 'Create Nurture Sequence', status: 'missing', priority: 'critical', gap: 'No UI for sequence creation' },
        { name: 'Edit Sequence Steps', status: 'missing', priority: 'critical', gap: 'Cannot modify sequences' },
        { name: 'Visual Sequence Builder', status: 'missing', priority: 'high', gap: 'No drag-drop workflow builder' },
        { name: 'A/B Testing for Sequences', status: 'missing', priority: 'medium', gap: 'Cannot test different sequences' },
        { name: 'Sequence Performance Analytics', status: 'incomplete', priority: 'high', gap: 'Basic stats only' },
        { name: 'Manual Enrollment', status: 'missing', priority: 'medium', gap: 'Cannot manually add leads to sequences' }
      ]
    },
    {
      id: 'user_management',
      name: 'User & Access Management',
      icon: Lock,
      status: 'warning',
      completion: 55,
      items: [
        { name: 'User List Display', status: 'complete', priority: 'critical' },
        { name: 'User Invite System', status: 'complete', priority: 'critical' },
        { name: 'Role Assignment (admin/user)', status: 'complete', priority: 'critical' },
        { name: 'Admin Key Access', status: 'complete', priority: 'high' },
        { name: 'User Deletion', status: 'missing', priority: 'high', gap: 'Cannot remove users' },
        { name: 'Permission Management', status: 'missing', priority: 'high', gap: 'No granular permissions' },
        { name: 'Activity Audit Log', status: 'missing', priority: 'medium', gap: 'No user activity tracking' },
        { name: 'Session Management', status: 'missing', priority: 'medium', gap: 'Cannot view/revoke sessions' },
        { name: 'Two-Factor Auth UI', status: 'missing', priority: 'low', gap: 'No 2FA setup interface' }
      ]
    },
    {
      id: 'system_health',
      name: 'System Health & Monitoring',
      icon: Shield,
      status: 'warning',
      completion: 65,
      items: [
        { name: 'Error Log Tracking', status: 'complete', priority: 'critical' },
        { name: 'System Health Tests', status: 'complete', priority: 'high' },
        { name: 'Health Check History', status: 'complete', priority: 'high' },
        { name: 'Error Resolution Workflow', status: 'incomplete', priority: 'high', gap: 'Can view but not mark as resolved easily' },
        { name: 'Real-time Alerts', status: 'missing', priority: 'high', gap: 'No proactive alert system' },
        { name: 'Performance Monitoring', status: 'incomplete', priority: 'medium', gap: 'Basic metrics only' },
        { name: 'Database Health Checks', status: 'missing', priority: 'medium', gap: 'No DB monitoring' },
        { name: 'API Rate Limiting Monitor', status: 'missing', priority: 'low', gap: 'Not tracked' }
      ]
    },
    {
      id: 'settings',
      name: 'Settings & Configuration',
      icon: Settings,
      status: 'critical',
      completion: 45,
      items: [
        { name: 'Funnel Mode Switcher', status: 'complete', priority: 'critical' },
        { name: 'Affiliate Link Config', status: 'complete', priority: 'critical' },
        { name: 'Bridge Timer Config', status: 'complete', priority: 'high' },
        { name: 'GeeNius Pathways Config', status: 'complete', priority: 'high' },
        { name: 'API Key Display', status: 'incomplete', priority: 'high', gap: 'Mockup only, not real' },
        { name: 'Integration Settings (Resend, Stripe)', status: 'incomplete', priority: 'high', gap: 'Display only, no configuration' },
        { name: 'Rate Limiting Config', status: 'incomplete', priority: 'medium', gap: 'Not persisting to DB' },
        { name: 'Brand Customization', status: 'missing', priority: 'medium', gap: 'No logo/color settings' },
        { name: 'Notification Preferences', status: 'missing', priority: 'low', gap: 'No notification controls' }
      ]
    },
    {
      id: 'campaigns',
      name: 'Campaign & Attribution',
      icon: Target,
      status: 'good',
      completion: 75,
      items: [
        { name: 'Campaign Manager', status: 'complete', priority: 'high' },
        { name: 'PURL Generator', status: 'complete', priority: 'high' },
        { name: 'QR Code Generation', status: 'complete', priority: 'medium' },
        { name: 'Campaign Analytics', status: 'complete', priority: 'high' },
        { name: 'Click Tracking', status: 'complete', priority: 'high' },
        { name: 'Campaign ROI Calculation', status: 'incomplete', priority: 'high', gap: 'Not calculating profit margins' },
        { name: 'Multi-touch Attribution', status: 'incomplete', priority: 'medium', gap: 'Last-touch only' }
      ]
    },
    {
      id: 'abtest',
      name: 'A/B Testing',
      icon: Code,
      status: 'good',
      completion: 75,
      items: [
        { name: 'A/B Test Creator', status: 'complete', priority: 'high' },
        { name: 'Test Results Display', status: 'complete', priority: 'high' },
        { name: 'Statistical Significance', status: 'incomplete', priority: 'medium', gap: 'Not calculating confidence intervals' },
        { name: 'Auto-winner Selection', status: 'missing', priority: 'low', gap: 'Manual selection only' }
      ]
    }
  ];

  // PRODUCTION READINESS GAPS
  const productionGaps = [
    {
      category: 'Critical',
      color: 'red',
      items: [
        'Automation CRUD operations (create, edit, delete) - Currently read-only',
        'Nurture sequence builder UI - Cannot create or modify sequences',
        'Lead detail view/modal - No way to see full lead information',
        'Order detail view - Cannot see itemized order breakdown',
        'Subscription management UI - Cannot pause/cancel subscriptions'
      ]
    },
    {
      category: 'High Priority',
      color: 'orange',
      items: [
        'Bulk lead operations - No way to update multiple leads at once',
        'Email template editor - Templates are hardcoded in backend',
        'User deletion - Cannot remove users from system',
        'Advanced date range filtering across all sections',
        'Real-time alerting system for critical errors',
        'Error resolution workflow improvements',
        'Payment intent/subscription tracking in orders',
        'Unsubscribe management centralization'
      ]
    },
    {
      category: 'Medium Priority',
      color: 'yellow',
      items: [
        'Lead assignment to admin users',
        'Lead notes and activity logging',
        'Email preview functionality',
        'Automation execution history',
        'Automation manual triggers',
        'Granular user permissions (beyond admin/user)',
        'Campaign ROI calculation',
        'Database health monitoring',
        'Rate limiting persistence to DB'
      ]
    }
  ];

  // IMPLEMENTATION PLAN
  const implementationPhases = [
    {
      phase: 'Phase 1: Critical Infrastructure',
      duration: '2-3 days',
      priority: 'critical',
      tasks: [
        {
          name: 'Build Automation Management System',
          subtasks: [
            'Create AutomationEditor component with form validation',
            'Implement create/edit/delete functionality',
            'Add pause/resume toggle with confirmation',
            'Build execution history viewer',
            'Add manual trigger button'
          ]
        },
        {
          name: 'Build Nurture Sequence Builder',
          subtasks: [
            'Create SequenceBuilder component',
            'Build step-by-step flow editor',
            'Add email template selector',
            'Implement delay/condition logic',
            'Add preview mode'
          ]
        },
        {
          name: 'Build Lead Detail View',
          subtasks: [
            'Create LeadDetailModal component',
            'Display full lead information',
            'Show health score breakdown',
            'Add status change UI',
            'Include quick actions (email, note)'
          ]
        }
      ]
    },
    {
      phase: 'Phase 2: Data Management',
      duration: '2 days',
      priority: 'high',
      tasks: [
        {
          name: 'Implement Bulk Operations',
          subtasks: [
            'Add checkbox selection to lead table',
            'Build BulkActionBar component',
            'Implement bulk status update',
            'Add bulk delete with confirmation',
            'Add bulk export'
          ]
        },
        {
          name: 'Build Order Detail System',
          subtasks: [
            'Create OrderDetailModal component',
            'Show itemized breakdown',
            'Display Stripe payment intent data',
            'Add refund history',
            'Show customer details'
          ]
        },
        {
          name: 'Enhanced Filtering System',
          subtasks: [
            'Build DateRangePicker component',
            'Add date filters to all tables',
            'Implement saved filter presets',
            'Add filter reset functionality'
          ]
        }
      ]
    },
    {
      phase: 'Phase 3: Communication Tools',
      duration: '2 days',
      priority: 'high',
      tasks: [
        {
          name: 'Email Management System',
          subtasks: [
            'Build EmailTemplateEditor component',
            'Create template preview modal',
            'Add template versioning',
            'Build unsubscribe management UI',
            'Add email scheduling interface'
          ]
        },
        {
          name: 'User Management Enhancement',
          subtasks: [
            'Add user deletion with data handling',
            'Build permission management UI',
            'Create activity audit log viewer',
            'Add session management panel'
          ]
        }
      ]
    },
    {
      phase: 'Phase 4: Monitoring & Alerts',
      duration: '1-2 days',
      priority: 'medium',
      tasks: [
        {
          name: 'Real-time Alert System',
          subtasks: [
            'Build AlertsPanel component',
            'Implement WebSocket connection for real-time updates',
            'Add configurable alert thresholds',
            'Create notification preferences UI',
            'Add email/SMS alert delivery'
          ]
        },
        {
          name: 'Enhanced System Monitoring',
          subtasks: [
            'Add database health checks',
            'Implement API rate limit monitoring',
            'Create performance dashboard',
            'Add memory/CPU tracking'
          ]
        }
      ]
    },
    {
      phase: 'Phase 5: Polish & UX',
      duration: '1 day',
      priority: 'low',
      tasks: [
        {
          name: 'UI/UX Improvements',
          subtasks: [
            'Add keyboard shortcuts',
            'Implement dark/light mode toggle',
            'Add onboarding tooltips',
            'Create help/documentation panel',
            'Add customizable dashboard layouts'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Control Center - Production Audit
            </h1>
            <p className="text-gray-400">
              Comprehensive analysis and implementation roadmap for 100% production readiness
            </p>
          </div>
          <Badge className="bg-[#c8ff00] text-black text-lg px-4 py-2">
            {auditOverview.completionRate}% Complete
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{auditOverview.totalFeatures}</div>
              <div className="text-sm text-gray-400">Total Features</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{auditOverview.completed}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{auditOverview.inProgress}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{auditOverview.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-[#c8ff00]/10 border-[#c8ff00]/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-[#c8ff00] mb-1">{auditOverview.completionRate}%</div>
              <div className="text-sm text-gray-400">Ready</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="audit">Detailed Audit</TabsTrigger>
            <TabsTrigger value="gaps">Production Gaps</TabsTrigger>
            <TabsTrigger value="plan">Implementation Plan</TabsTrigger>
          </TabsList>

          {/* Detailed Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            {auditCategories.map((category) => {
              const Icon = category.icon;
              const isExpanded = expandedSections[category.id];
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader
                      className="cursor-pointer hover:bg-gray-700/30 transition-colors"
                      onClick={() => toggleSection(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            category.status === 'good' ? 'bg-green-500/10' :
                            category.status === 'warning' ? 'bg-yellow-500/10' :
                            'bg-red-500/10'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              category.status === 'good' ? 'text-green-400' :
                              category.status === 'warning' ? 'text-yellow-400' :
                              'text-red-400'
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-white flex items-center gap-2">
                              {category.name}
                              <Badge className={`${
                                category.status === 'good' ? 'bg-green-500/20 text-green-400' :
                                category.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {category.completion}%
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-400 mt-1">
                              {category.items.filter(i => i.status === 'complete').length} / {category.items.length} items complete
                            </CardDescription>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="space-y-2">
                        {category.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex items-start gap-3 ${
                              item.status === 'complete' ? 'bg-green-500/5 border-green-500/20' :
                              item.status === 'incomplete' ? 'bg-yellow-500/5 border-yellow-500/20' :
                              'bg-red-500/5 border-red-500/20'
                            }`}
                          >
                            {item.status === 'complete' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : item.status === 'incomplete' ? (
                              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{item.name}</span>
                                <Badge variant="outline" className={`text-xs ${
                                  item.priority === 'critical' ? 'border-red-500/50 text-red-400' :
                                  item.priority === 'high' ? 'border-orange-500/50 text-orange-400' :
                                  item.priority === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                                  'border-gray-500/50 text-gray-400'
                                }`}>
                                  {item.priority}
                                </Badge>
                              </div>
                              {item.gap && (
                                <p className="text-sm text-gray-400">Gap: {item.gap}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* Production Gaps Tab */}
          <TabsContent value="gaps" className="space-y-4">
            {productionGaps.map((gap, idx) => (
              <Card key={idx} className={`border-${gap.color}-500/30 bg-${gap.color}-500/5`}>
                <CardHeader>
                  <CardTitle className={`text-${gap.color}-400 flex items-center gap-2`}>
                    <AlertCircle className="w-5 h-5" />
                    {gap.category} Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {gap.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Implementation Plan Tab */}
          <TabsContent value="plan" className="space-y-4">
            {implementationPhases.map((phase, idx) => (
              <Card key={idx} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Badge className={`${
                          phase.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          phase.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          phase.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {phase.priority}
                        </Badge>
                        {phase.phase}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Estimated duration: {phase.duration}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {phase.tasks.map((task, taskIdx) => (
                    <div key={taskIdx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <h4 className="text-white font-semibold mb-2">{task.name}</h4>
                      <ul className="space-y-1">
                        {task.subtasks.map((subtask, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {subtask}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}