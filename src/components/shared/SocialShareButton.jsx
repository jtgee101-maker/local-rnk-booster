import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

export default function SocialShareButton({ businessName, healthScore }) {
  const shareText = `Just got my free GMB audit from LocalRank.ai! My business scored ${healthScore}/100. Check yours:`;
  const shareUrl = 'https://localrank.ai?ref=social';

  const handleShare = (platform) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent('Check out LocalRank.ai')}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    };

    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'LocalRank.ai - Free GMB Audit',
        text: shareText,
        url: shareUrl
      });
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('facebook')}
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Facebook className="w-4 h-4 mr-2" />
        Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('twitter')}
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Twitter className="w-4 h-4 mr-2" />
        Tweet
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('linkedin')}
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Linkedin className="w-4 h-4 mr-2" />
        Post
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('email')}
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Mail className="w-4 h-4 mr-2" />
        Email
      </Button>
    </div>
  );
}