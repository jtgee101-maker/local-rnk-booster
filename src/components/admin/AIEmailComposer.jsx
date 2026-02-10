import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, Eye, Save, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AIEmailComposer({ leadId, onClose }) {
  const [emailType, setEmailType] = useState('welcome');
  const [tone, setTone] = useState('professional');
  const [goal, setGoal] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      toast.info('AI is crafting your email...');

      const response = await base44.functions.invoke('ai/generateEmail', {
        email_type: emailType,
        lead_id: leadId,
        tone,
        goal,
        custom_instructions: customInstructions
      });

      setGeneratedEmail(response.data.email);
      toast.success('Email generated!');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedEmail) return;

    try {
      setSending(true);
      toast.info('Sending email...');

      await base44.functions.invoke('ai/sendPersonalizedEmail', {
        lead_id: leadId,
        email_type: emailType
      });

      toast.success('Email sent successfully!');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!generatedEmail) return;

    try {
      await base44.entities.EmailTemplate.create({
        name: `${emailType} - ${new Date().toLocaleDateString()}`,
        type: emailType,
        subject_line: generatedEmail.subject_line,
        body_html: generatedEmail.body,
        ai_generated: true,
        ai_prompt: customInstructions,
        personalization_variables: ['business_name', 'health_score', 'critical_issues'],
        status: 'active'
      });

      toast.success('Template saved!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-gray-700 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Email Composer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Generate personalized emails with AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Email Type</label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
                  <SelectItem value="nurture">Nurture</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {emailType === 'campaign' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Campaign Goal</label>
              <Input
                placeholder="e.g., Promote new service, Share case study"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Custom Instructions (Optional)</label>
            <Textarea
              placeholder="Add specific requirements or details to include..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white"
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Email Preview */}
      {generatedEmail && (
        <Card className="border-gray-700 bg-gray-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Generated Email</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreview(!preview)}
                  className="border-gray-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {preview ? 'Hide' : 'Preview'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveTemplate}
                  className="border-gray-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Subject Line</label>
              <Input
                value={generatedEmail.subject_line}
                onChange={(e) => setGeneratedEmail({...generatedEmail, subject_line: e.target.value})}
                className="bg-gray-900/50 border-gray-700 text-white font-semibold"
              />
            </div>

            {generatedEmail.preview_text && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Preview Text</label>
                <Input
                  value={generatedEmail.preview_text}
                  onChange={(e) => setGeneratedEmail({...generatedEmail, preview_text: e.target.value})}
                  className="bg-gray-900/50 border-gray-700 text-white text-sm"
                />
              </div>
            )}

            {preview && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email Body</label>
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-700 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: generatedEmail.body }}
                />
              </div>
            )}

            {generatedEmail.personalization_tips && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Personalization Tips</label>
                <ul className="space-y-1">
                  {generatedEmail.personalization_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-[#c8ff00] text-black hover:bg-[#a8dd00]"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                onClick={handleGenerate}
                variant="outline"
                className="border-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}