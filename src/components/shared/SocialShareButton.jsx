import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

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
    <div className="flex flex-wrap gap-3 justify-center">
      <Button
        onClick={() => handleShare('facebook')}
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        <Facebook className="w-4 h-4 mr-2" />
        Share
      </Button>
      <Button
        onClick={() => handleShare('twitter')}
        className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold px-6 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        <Twitter className="w-4 h-4 mr-2" />
        Tweet
      </Button>
      <Button
        onClick={() => handleShare('linkedin')}
        className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        <Linkedin className="w-4 h-4 mr-2" />
        Post
      </Button>
      <Button
        onClick={() => handleShare('email')}
        className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black font-semibold px-6 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        <Mail className="w-4 h-4 mr-2" />
        Email
      </Button>
    </div>
  );
}