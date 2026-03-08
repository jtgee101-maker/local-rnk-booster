import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Crown, Wrench, GraduationCap, ArrowRight, CheckCircle,
  Shield, Zap, TrendingUp, Users, Award, ExternalLink, Loader2, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import GeeniusFAQ from '@/components/geenius/GeeniusFAQ';

export default function BridgeGeenius() {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [viewStartTime] = useState(Date.now());
  const [expandedAlt, setExpandedAlt] = useState(null);
  const [pathwaySettings, setPathwaySettings] = useState(null);
  const [urlsConfigured, setUrlsConfigured] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('lead_id');
        
        if (leadId) {
          const leads = await base44.entities.Lead.filter({ id: leadId });
          if (leads.length > 0) {
            setLead(leads[0]);

            const behaviors = await base44.entities.UserBehavior.filter({ 
              email: leads[0].email 
            });
            const userSessionId = behaviors.length > 0 ? behaviors[0].session_id : `bridge_${Date.now()}`;
            setSessionId(userSessionId);

            await base44.entities.ConversionEvent.create({
              funnel_version: 'geenius',
              event_name: 'bridge_viewed',
              lead_id: leadId,
              session_id: userSessionId,
              properties: {
                business_name: leads[0].business_name,
                health_score: leads[0].health_score,
                email: leads[0].email,
                phone: leads[0].phone
              }
            });

            await base44.analytics.track({
              eventName: 'geenius_bridge_viewed',
              properties: {
                lead_id: leadId,
                session_id: userSessionId,
                health_score: leads[0].health_score
              }
            });

            if (behaviors.length > 0) {
              await base44.entities.UserBehavior.update(behaviors[0].id, {
                pages_viewed: [...(behaviors[0].pages_viewed || []), 'BridgeGeenius'],
                interactions: [
                  ...(behaviors[0].interactions || []),
                  {
                    type: 'bridge_viewed',
                    timestamp: Date.now(),
                    lead_id: leadId
                  }
                ]
              });
            }
          }
        }

        const settings = await base44.entities.AppSettings.filter({ 
          setting_key: 'geenius_pathways' 
        });
        
        if (settings.length > 0) {
          setPathwaySettings(settings[0].setting_value);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const PATHWAY_MAP = {
    'govtech_grant': 'grant',
    'done_for_you': 'dfy',
    'diy_software': 'diy'
  };

  const trackPathwayClick = async (pathway, url) => {
    const timeOnBridge = Math.round((Date.now() - viewStartTime) / 1000);
    
    try {
      // Write selected_pathway to lead record so orchestrator can reliably detect it
      if (lead?.id) {
        await base44.entities.Lead.update(lead.id, {
          selected_pathway: PATHWAY_MAP[pathway] || pathway,
          pathway_selected_at: new Date().toISOString()
        });
      }

      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: `pathway_${pathway}_clicked`,
        lead_id: lead?.id,
        session_id: sessionId,
        properties: {
          pathway_name: pathway,
          destination_url: url,
          business_name: lead?.business_name,
          email: lead?.email,
          phone: lead?.phone,
          health_score: lead?.health_score,
          time_on_bridge: timeOnBridge
        }
      });

      await base44.analytics.track({
        eventName: 'geenius_pathway_selected',
        properties: {
          pathway: pathway,
          lead_id: lead?.id,
          health_score: lead?.health_score
        }
      });

      try {
        const behaviors = await base44.entities.UserBehavior.filter({ 
          email: lead?.email 
        });
        
        if (behaviors.length > 0) {
          const behavior = behaviors[0];
          await base44.entities.UserBehavior.update(behavior.id, {
            interactions: [
              ...(behavior.interactions || []),
              { 
                type: `pathway_${pathway}_selected`, 
                timestamp: Date.now() 
              }
            ]
          });
        }
      } catch (behaviorError) {
        console.error('Behavior update failed:', behaviorError);
      }

      toast.success(`Opening ${pathway} pathway...`);
      
      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
    } catch (error) {
      console.error('Tracking error:', error);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-14 md:space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">GeeNius Path</span>
              </h1>
            </div>
            
            {lead && (
              <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span className="text-white font-semibold text-sm sm:text-base">{lead.business_name}</span>
                {lead.health_score && (
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50 text-xs">
                    Score: {lead.health_score}/100
                  </Badge>
                )}
              </div>
            )}

            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
              We've identified the best path forward for your business growth—complete transparency with the infrastructure to scale
            </p>
          </div>

          {/* Hero Gov Tech Grant */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-3xl blur-2xl -z-10" />
            
            <Card className="relative overflow-hidden border-2 border-purple-500/80 bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-purple-900/60 shadow-2xl shadow-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-50" />
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
              
              <CardHeader className="relative space-y-6 pb-8 md:pb-10">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/30 rounded-2xl border border-purple-400/50">
                        <Crown className="w-8 h-8 text-purple-300" />
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm px-4 py-1.5 shadow-lg">
                        RECOMMENDED
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm px-4 py-1.5">
                    ✓ ZERO INVESTMENT
                  </Badge>
                </div>
                
                <div>
                  <CardTitle className="text-3xl md:text-4xl lg:text-5xl text-white mb-3 leading-tight">
                    GeeNius Gov Tech Grant
                  </CardTitle>
                  <CardDescription className="text-purple-100/90 text-lg md:text-xl leading-relaxed">
                    Your payment processor may qualify you for free infrastructure upgrades and rankings through government incentives
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3 p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-200">
                        <span className="font-bold text-white block mb-1">Free Infrastructure Upgrade</span>
                        <span className="text-sm">Control your own lead sourcing and rankings through Google</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-200">
                        <span className="font-bold text-white block mb-1">Fire Expensive Platforms</span>
                        <span className="text-sm">Eliminate Thumbtack, Google Guaranteed, and other costly intermediaries</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-200">
                        <span className="font-bold text-white block mb-1">Rankings as Part of the Grant</span>
                        <span className="text-sm">Get your Google rankings optimized as part of your eligibility benefits</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-300">$0</div>
                    <div className="text-xs text-gray-400 mt-1">Investment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-300">2-3 Days</div>
                    <div className="text-xs text-gray-400 mt-1">Eligibility Check</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-300">∞ ROI</div>
                    <div className="text-xs text-gray-400 mt-1">Potential Return</div>
                  </div>
                </div>

                <Button
                  onClick={() => trackPathwayClick('govtech_grant', pathwaySettings.pathway1_url)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                >
                  Check My Eligibility Now
                  <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform" />
                </Button>

                <div className="text-center text-sm text-purple-200/70 pt-4 border-t border-purple-500/30">
                  <p>✓ No credit card required • 100% Transparent Process • Real qualification results in 2-3 business days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alternative Pathways */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium">Not a fit? Explore other options</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Done For You */}
              <div className="group">
                <button
                  onClick={() => setExpandedAlt(expandedAlt === 'dfy' ? null : 'dfy')}
                  className="w-full text-left"
                >
                  <Card className="relative bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30 border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10">
                    <CardHeader className="relative space-y-3 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Wrench className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">Done For You Service</CardTitle>
                            <p className="text-xs text-blue-200/60 mt-1">Complete hands-off solution</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${expandedAlt === 'dfy' ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>

                    {expandedAlt === 'dfy' && (
                      <CardContent className="relative space-y-4 pt-0 pb-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-2 text-blue-200">
                            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Verified Provider</strong> - Hand-picked, proven track record</span>
                          </div>
                          <div className="flex gap-2 text-blue-200">
                            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Hands-Off</strong> - They handle everything from A to Z</span>
                          </div>
                          <div className="flex gap-2 text-blue-200">
                            <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Proven Results</strong> - Based on your specific issues</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => trackPathwayClick('done_for_you', pathwaySettings.pathway2_url)}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5 mt-4 text-sm"
                        >
                          Get Verified Provider
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                </button>
              </div>

              {/* DIY Software */}
              <div className="group">
                <button
                  onClick={() => setExpandedAlt(expandedAlt === 'diy' ? null : 'diy')}
                  className="w-full text-left"
                >
                  <Card className="relative bg-gradient-to-br from-green-900/30 via-emerald-800/20 to-green-900/30 border-green-500/40 hover:border-green-400/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-green-500/10">
                    <CardHeader className="relative space-y-3 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/20 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">DIY Software License</CardTitle>
                            <p className="text-xs text-green-200/60 mt-1">Full control & training included</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-300 ${expandedAlt === 'diy' ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>

                    {expandedAlt === 'diy' && (
                      <CardContent className="relative space-y-4 pt-0 pb-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-2 text-green-200">
                            <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Full Training</strong> - Step-by-step guides & video tutorials</span>
                          </div>
                          <div className="flex gap-2 text-green-200">
                            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Support Access</strong> - Email support from the digital team</span>
                          </div>
                          <div className="flex gap-2 text-green-200">
                            <GraduationCap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Your Pace</strong> - Implement when you're ready</span>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-300 mt-3">$199/month</div>
                        <Button
                          onClick={() => trackPathwayClick('diy_software', pathwaySettings.pathway3_checkout_url)}
                          className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-5 mt-4 text-sm"
                        >
                          Start DIY License
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <GeeniusFAQ />

          {/* Footer Note */}
          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-700/50">
            <p>We're committed to 100% transparency. Each pathway is built for your specific business needs based on your GMB health score</p>
          </div>
        </div>
      </div>
    </div>
  );
}