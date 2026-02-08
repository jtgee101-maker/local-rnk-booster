import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';
import { toast } from 'sonner';

const FUNNELS = [
  {
    id: 'geenius',
    name: 'GeeNius Path',
    description: '3 pathway offer bridge with affiliate focus',
    pages: ['QuizGeenius', 'ResultsGeenius', 'BridgeGeenius'],
    color: 'purple'
  },
  {
    id: 'v3',
    name: 'Quiz V3 (Aggregator)',
    description: 'Stop paying Thumbtack/Angi narrative + Bridge V3',
    pages: ['QuizV3', 'BridgeV3'],
    color: 'yellow'
  },
  {
    id: 'v2',
    name: 'Quiz V2 (Lead Independence)',
    description: 'Lead independence angle + Checkout V2',
    pages: ['QuizV2', 'CheckoutV2'],
    color: 'blue'
  }
];

export default function FunnelModeControl() {
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadActiveFunnel();
  }, []);

  const loadActiveFunnel = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'active_funnel_mode'
      });

      if (settings.length > 0) {
        setActiveFunnel(settings[0].setting_value.funnel_id || 'geenius');
      } else {
        // Create default setting
        await base44.entities.AppSettings.create({
          setting_key: 'active_funnel_mode',
          setting_value: { funnel_id: 'geenius' },
          category: 'general',
          description: 'Controls which quiz funnel is active on the main landing page'
        });
        setActiveFunnel('geenius');
      }
    } catch (error) {
      console.error('Error loading funnel mode:', error);
      toast.error('Failed to load funnel settings');
    } finally {
      setLoading(false);
    }
  };

  const switchFunnel = async (funnelId) => {
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'active_funnel_mode'
      });

      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          setting_value: { 
            funnel_id: funnelId,
            updated_at: new Date().toISOString()
          }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'active_funnel_mode',
          setting_value: { funnel_id: funnelId },
          category: 'general',
          description: 'Controls which quiz funnel is active on the main landing page'
        });
      }

      setActiveFunnel(funnelId);

      // Track funnel switch
      await base44.analytics.track({
        eventName: 'admin_funnel_switched',
        properties: {
          from_funnel: activeFunnel,
          to_funnel: funnelId,
          timestamp: Date.now()
        }
      });

      await base44.entities.ConversionEvent.create({
        funnel_version: 'admin',
        event_name: 'funnel_mode_changed',
        properties: {
          from_funnel: activeFunnel,
          to_funnel: funnelId,
          changed_by: 'admin'
        }
      }).catch(err => console.error('Tracking failed:', err));

      toast.success(`Funnel switched to ${FUNNELS.find(f => f.id === funnelId).name}`);
    } catch (error) {
      console.error('Error switching funnel:', error);
      toast.error('Failed to switch funnel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-[#c8ff00]" />
            <CardTitle className="text-white">Funnel Mode Control</CardTitle>
          </div>
          <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/50">
            LIVE CONTROL
          </Badge>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Switch between quiz funnels in real-time. All traffic will be directed to the selected funnel.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {FUNNELS.map((funnel) => {
          const isActive = activeFunnel === funnel.id;
          const colorClasses = {
            purple: {
              border: 'border-purple-500/50',
              bg: 'bg-purple-500/10',
              hover: 'hover:border-purple-400',
              badge: 'bg-purple-500',
              button: 'bg-purple-600 hover:bg-purple-500'
            },
            yellow: {
              border: 'border-[#c8ff00]/50',
              bg: 'bg-[#c8ff00]/10',
              hover: 'hover:border-[#c8ff00]',
              badge: 'bg-[#c8ff00] text-black',
              button: 'bg-[#c8ff00] hover:bg-[#d4ff33] text-black'
            },
            blue: {
              border: 'border-blue-500/50',
              bg: 'bg-blue-500/10',
              hover: 'hover:border-blue-400',
              badge: 'bg-blue-500',
              button: 'bg-blue-600 hover:bg-blue-500'
            }
          };

          const colors = colorClasses[funnel.color];

          return (
            <div
              key={funnel.id}
              className={`p-4 border-2 rounded-xl transition-all ${
                isActive
                  ? `${colors.border} ${colors.bg}`
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">{funnel.name}</h3>
                    {isActive && (
                      <Badge className={`${colors.badge} text-white font-bold animate-pulse`}>
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{funnel.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {funnel.pages.map((page, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-gray-300 border-gray-600 text-xs"
                  >
                    {page}
                  </Badge>
                ))}
              </div>

              {!isActive && (
                <Button
                  onClick={() => switchFunnel(funnel.id)}
                  disabled={saving}
                  className={`w-full ${colors.button} font-semibold transition-colors touch-manipulation`}
                >
                  {saving ? 'Switching...' : 'Activate This Funnel'}
                </Button>
              )}

              {isActive && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                  <span className="text-green-400 font-semibold text-sm">
                    ✓ This funnel is currently serving all traffic
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm mb-1">How It Works</h4>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Changes take effect immediately for all new visitors</li>
                <li>• Existing sessions continue on their current funnel</li>
                <li>• All analytics are tracked separately per funnel</li>
                <li>• Use this to A/B test different approaches</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}