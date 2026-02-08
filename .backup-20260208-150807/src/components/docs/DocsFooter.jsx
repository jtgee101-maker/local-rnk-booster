import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, BookOpen, AlertCircle } from 'lucide-react';

export default function DocsFooter() {
  return (
    <footer className="border-t border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm mt-20">
      <div className="px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Documentation Links */}
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#c8ff00]" />
                Documentation
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to={createPageUrl('DocsHome')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    All Docs & Guides
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('GuideQuizGeenius')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    QuizGeenius Flow
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Roadmap')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    12-Month Roadmap
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Features')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Features & Capabilities
                  </Link>
                </li>
              </ul>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c8ff00]" />
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to={createPageUrl('QuizV3')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Free GMB Audit
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Pricing')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Referrals')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Referral Program
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#c8ff00]" />
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@localrank.ai" className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Email Support
                  </a>
                </li>
                <li>
                  <Link to={createPageUrl('Privacy')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Terms')} className="text-gray-400 hover:text-[#c8ff00] transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700/50 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} LocalRank.ai. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}