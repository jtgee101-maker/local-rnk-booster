import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Crown, Wrench, GraduationCap, ArrowRight, CheckCircle,
  Shield, Zap, TrendingUp, Users, Award, ExternalLink, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function BridgeGeenius() {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pathwaySettings, setPathwaySettings] = useState({
    pathway1_url: 'https://example.com/govtech-grant',
    pathway2_url: 'https://example.com/done-for-you',
    pathway3_checkout_url: 'https://buy.stripe.com/test_example'
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Get lead from URL
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('lead_id');
        
        if (leadId) {
          const leads = await base44.entities.Lead.filter({ id: leadId });
          if (leads.length > 0) {
            setLead(leads[0]);
          }
        }

        // Fetch pathway settings
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

  const trackPathwayClick = async (pathway, url) => {
    try {
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: `pathway_${pathway}_clicked`,
        lead_id: lead?.id,
        properties: {
          pathway_name: pathway,
          destination_url: url,
          business_name: lead?.business_name
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

      <div className="relative z-10 px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-purple-400 animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-black text-white">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">GeeNius Path</span>
              </h1>
            </div>
            
            {lead && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-white font-semibold">{lead.business_name}</span>
                {lead.health_score && (
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50">
                    Score: {lead.health_score}/100
                  </Badge>
                )}
              </div>
            )}

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Based on your audit results, we've identified <span className="text-purple-400 font-bold">three exclusive pathways</span> to transform your business growth
            </p>
          </div>

          {/* Pathways Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Pathway 1: Gov Tech Grant */}
            <Card className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border-purple-500/50 hover:border-purple-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10" />
              
              <CardHeader className="relative space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/30 group-hover:scale-110 transition-transform">
                    <Crown className="w-8 h-8 text-purple-400" />
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-3 py-1 animate-pulse">
                    EXCLUSIVE
                  </Badge>
                </div>
                
                <div>
                  <CardTitle className="text-2xl md:text-3xl text-white mb-2">
                    GeeNius Gov Tech Grant
                  </CardTitle>
                  <CardDescription className="text-purple-200/80 text-base leading-relaxed">
                    Discover if your payment processor qualifies you for infrastructure upgrades
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Free Infrastructure Upgrade</span> - Control your own lead sourcing through Google ranking
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Fire Service Providers</span> - Eliminate Thumbtack and other expensive platforms
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">GeeNiusPays Rebate Path</span> - Get your rankings done as part of the grant
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/30">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Eligibility Check</span>
                      <span className="text-purple-400 font-semibold">Required</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Processing Time</span>
                      <span className="text-purple-400 font-semibold">2-3 Business Days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Investment</span>
                      <span className="text-purple-400 font-bold text-lg">$0</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => trackPathwayClick('govtech_grant', pathwaySettings.pathway1_url)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 text-lg group/btn"
                  >
                    Check My Eligibility
                    <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pathway 2: Done For You */}
            <Card className="relative bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 border-blue-500/50 hover:border-blue-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />
              
              <CardHeader className="relative space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 group-hover:scale-110 transition-transform">
                    <Wrench className="w-8 h-8 text-blue-400" />
                  </div>
                  <Badge className="bg-green-500/80 text-white font-bold px-3 py-1">
                    VERIFIED
                  </Badge>
                </div>
                
                <div>
                  <CardTitle className="text-2xl md:text-3xl text-white mb-2">
                    Done For You Service
                  </CardTitle>
                  <CardDescription className="text-blue-200/80 text-base leading-relaxed">
                    Set yourself up for success without thinking about it
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Verified Provider</span> - Hand-picked, proven track record
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Hands-Off Solution</span> - They handle everything from A to Z
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Proven Results</span> - Based on your specific health score issues
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-500/30">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Setup Time</span>
                      <span className="text-blue-400 font-semibold">Immediate</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Management</span>
                      <span className="text-blue-400 font-semibold">Fully Managed</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Best For</span>
                      <span className="text-blue-400 font-semibold">Busy Owners</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => trackPathwayClick('done_for_you', pathwaySettings.pathway2_url)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-6 text-lg group/btn"
                  >
                    Get Verified Provider
                    <ExternalLink className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pathway 3: DIY Software */}
            <Card className="relative bg-gradient-to-br from-green-900/40 via-emerald-800/30 to-green-900/40 border-green-500/50 hover:border-green-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -z-10" />
              
              <CardHeader className="relative space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-green-500/20 rounded-xl border border-green-400/30 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-8 h-8 text-green-400" />
                  </div>
                  <Badge className="bg-orange-500/80 text-white font-bold px-3 py-1">
                    LIMITED
                  </Badge>
                </div>
                
                <div>
                  <CardTitle className="text-2xl md:text-3xl text-white mb-2">
                    DIY Software License
                  </CardTitle>
                  <CardDescription className="text-green-200/80 text-base leading-relaxed">
                    Take control with full access to training and support
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Full Training Library</span> - Step-by-step guides and video tutorials
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Support Hotline</span> - Digital team assistance (email support)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">DIY Control</span> - Implement at your own pace
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-500/30">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Access Level</span>
                      <span className="text-green-400 font-semibold">Full Platform</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Support</span>
                      <span className="text-green-400 font-semibold">Email Only</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Monthly Fee</span>
                      <span className="text-green-400 font-bold text-2xl">$199</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => trackPathwayClick('diy_software', pathwaySettings.pathway3_checkout_url)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-6 text-lg group/btn"
                  >
                    Start DIY License
                    <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    First come, first serve basis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Bar */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-sm text-gray-400">Exclusive Pathways</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Tailored Solutions</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Digital Support</div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-gray-500 text-sm">
            <p>All pathways are designed based on your unique business needs and GMB health score</p>
          </div>
        </div>
      </div>
    </div>
  );
}