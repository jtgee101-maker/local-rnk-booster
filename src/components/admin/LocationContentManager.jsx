import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, FileText, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LocationContentManager({ leadId }) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (leadId) {
      loadContent();
    }
  }, [leadId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.LocationContent.filter({ lead_id: leadId });
      setContent(data);
    } catch (error) {
      console.error('Failed to load location content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateStatus = async (contentId, newStatus) => {
    try {
      await base44.entities.LocationContent.update(contentId, { status: newStatus });
      await loadContent();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const gmbPosts = content.filter(c => c.content_type === 'gmb_post');
  const landingPages = content.filter(c => c.content_type === 'landing_page');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location-Specific Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            No location-specific content generated yet. This will be created automatically after the ranking grid audit.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location-Specific Content ({content.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gmb">
          <TabsList>
            <TabsTrigger value="gmb">GMB Posts ({gmbPosts.length})</TabsTrigger>
            <TabsTrigger value="landing">Landing Pages ({landingPages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="gmb" className="space-y-4 mt-4">
            {gmbPosts.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{item.target_location?.name}</span>
                      {item.weak_zone && (
                        <Badge variant="destructive" className="text-xs">Weak Zone</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{item.status}</Badge>
                    </div>
                    {item.ranking_position && (
                      <p className="text-xs text-gray-500">Current Position: #{item.ranking_position}</p>
                    )}
                  </div>
                </div>

                {item.gmb_post_variations?.map((variation, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">Variation {idx + 1}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(variation.body, `${item.id}-${idx}`)}
                      >
                        {copiedId === `${item.id}-${idx}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {variation.headline && (
                      <p className="font-semibold text-sm">{variation.headline}</p>
                    )}
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{variation.body}</p>
                    {variation.cta && (
                      <p className="text-sm text-blue-600 font-medium">CTA: {variation.cta}</p>
                    )}
                    {variation.best_time_to_post && (
                      <p className="text-xs text-gray-500">📅 Best time: {variation.best_time_to_post}</p>
                    )}
                  </div>
                ))}

                {item.local_landmarks && item.local_landmarks.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Nearby landmarks:</span> {item.local_landmarks.map(l => l.name).slice(0, 3).join(', ')}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {item.status === 'generated' && (
                    <Button size="sm" onClick={() => updateStatus(item.id, 'approved')}>
                      Approve
                    </Button>
                  )}
                  {item.status === 'approved' && (
                    <Button size="sm" variant="default" onClick={() => updateStatus(item.id, 'published')}>
                      Mark as Published
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'archived')}>
                    Archive
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="landing" className="space-y-4 mt-4">
            {landingPages.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className="font-semibold">{item.target_location?.name}</span>
                      {item.weak_zone && (
                        <Badge variant="destructive" className="text-xs">Weak Zone</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{item.status}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(JSON.stringify(item.generated_content, null, 2), item.id)}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{item.generated_content?.headline}</h3>
                    {item.generated_content?.subheadline && (
                      <p className="text-gray-600 text-sm">{item.generated_content.subheadline}</p>
                    )}
                  </div>

                  {item.generated_content?.hero_section && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm">{item.generated_content.hero_section}</p>
                    </div>
                  )}

                  {item.generated_content?.benefits && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Benefits:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                        {item.generated_content.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.generated_content?.meta_title && (
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <p className="font-semibold">Meta Title:</p>
                      <p className="text-gray-600">{item.generated_content.meta_title}</p>
                      <p className="font-semibold mt-2">Meta Description:</p>
                      <p className="text-gray-600">{item.generated_content.meta_description}</p>
                    </div>
                  )}

                  {item.generated_content?.keywords && (
                    <div className="flex flex-wrap gap-1">
                      {item.generated_content.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {item.status === 'generated' && (
                    <Button size="sm" onClick={() => updateStatus(item.id, 'approved')}>
                      Approve
                    </Button>
                  )}
                  {item.status === 'approved' && (
                    <Button size="sm" variant="default" onClick={() => updateStatus(item.id, 'published')}>
                      Mark as Published
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'archived')}>
                    Archive
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}