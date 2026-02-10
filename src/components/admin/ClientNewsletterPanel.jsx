import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { Mail, Send, Users, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientNewsletterPanel() {
  const [sending, setSending] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [lastSent, setLastSent] = useState(null);
  
  const [newsletter, setNewsletter] = useState({
    subject: '',
    headline: '',
    featured_content: '',
    updates: '',
    business_intel: '',
    special_offer: ''
  });

  React.useEffect(() => {
    loadSubscriberCount();
  }, []);

  const loadSubscriberCount = async () => {
    try {
      const leads = await base44.entities.Lead.list('-created_date', 5000);
      const subscribers = leads.filter(l => l.tags && l.tags.includes('newsletter_subscriber'));
      setSubscriberCount(subscribers.length);
    } catch (error) {
      console.error('Error loading subscriber count:', error);
    }
  };

  const handleSend = async () => {
    if (!newsletter.subject || !newsletter.headline) {
      toast.error('Please fill in subject and headline');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('nurture/sendClientNewsletter', {
        ...newsletter,
        test_mode: testMode
      });

      if (response.data.success) {
        toast.success(`Newsletter sent to ${response.data.sent} recipients!`);
        setLastSent(new Date().toISOString());
        
        // Reset form
        setNewsletter({
          subject: '',
          headline: '',
          featured_content: '',
          updates: '',
          business_intel: '',
          special_offer: ''
        });
      } else {
        toast.error('Failed to send newsletter');
      }
    } catch (error) {
      toast.error('Error sending newsletter: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Client Newsletter
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Morning Brew Style
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1">
                Send updates & intel to engaged clients
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-white">{subscriberCount}</span>
              <span>subscribers</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Test Mode</p>
              <p className="text-xs text-gray-400">
                {testMode ? 'Sends only to your admin email' : `Sends to all ${subscriberCount} subscribers`}
              </p>
            </div>
          </div>
          <Switch
            checked={testMode}
            onCheckedChange={setTestMode}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {/* Newsletter Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Subject Line *</label>
            <Input
              placeholder="Your Weekly GeeNius Insider - [Date]"
              value={newsletter.subject}
              onChange={(e) => setNewsletter({ ...newsletter, subject: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Headline *</label>
            <Input
              placeholder="This Week: Google's New Algorithm Update & Your Strategy"
              value={newsletter.headline}
              onChange={(e) => setNewsletter({ ...newsletter, headline: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Featured Content</label>
            <Textarea
              placeholder="Main story or featured insight (supports HTML)"
              value={newsletter.featured_content}
              onChange={(e) => setNewsletter({ ...newsletter, featured_content: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Platform Updates</label>
            <Textarea
              placeholder="New features, improvements, releases (supports HTML)"
              value={newsletter.updates}
              onChange={(e) => setNewsletter({ ...newsletter, updates: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Business Intel</label>
            <Textarea
              placeholder="Industry news, tips, strategies (supports HTML)"
              value={newsletter.business_intel}
              onChange={(e) => setNewsletter({ ...newsletter, business_intel: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Special Offer</label>
            <Textarea
              placeholder="Exclusive offer or promotion for clients"
              value={newsletter.special_offer}
              onChange={(e) => setNewsletter({ ...newsletter, special_offer: e.target.value })}
              className="bg-gray-900/50 border-gray-700 text-white min-h-[60px]"
            />
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sending || !newsletter.subject || !newsletter.headline}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Newsletter...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {testMode ? 'Send Test Email' : `Send to ${subscriberCount} Subscribers`}
            </>
          )}
        </Button>

        {/* Last Sent */}
        {lastSent && (
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            Last sent: {new Date(lastSent).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}