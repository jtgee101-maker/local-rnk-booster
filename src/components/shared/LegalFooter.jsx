import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, Lock, FileText } from 'lucide-react';

export default function LegalFooter() {
  return (
    <footer className="border-t border-gray-800 bg-[#0a0a0f] mt-8">
      {/* Trust Badges */}
      <div className="max-w-6xl mx-auto px-4 py-4 border-b border-gray-800">
        <div className="flex flex-wrap justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <FileText className="w-3.5 h-3.5 text-[#c8ff00]" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>🔒</span>
            <span>PCI DSS Certified</span>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3">LocalRank.ai</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              AI-powered GMB optimization software helping 7M+ local businesses dominate their markets.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to={createPageUrl('Privacy')} className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Terms')} className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#refund" className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="#dmca" className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  DMCA Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="mailto:support@localrank.ai" className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#billing" className="text-gray-400 hover:text-[#c8ff00] transition-colors">
                  Billing Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>support@localrank.ai</li>
              <li>Available 24/7</li>
              <li>Response within 2 hours</li>
            </ul>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="border-t border-gray-800 pt-6 space-y-3">
          <div className="text-gray-600 text-[10px] leading-relaxed space-y-2">
            <p>
              <strong className="text-gray-500">REFUND POLICY:</strong> We offer a 30-day money-back guarantee on all purchases. If you're not satisfied with our service, contact support@localrank.ai within 30 days for a full refund. Refunds are processed within 5-7 business days.
            </p>
            <p>
              <strong className="text-gray-500">DISCLAIMER:</strong> Results may vary. While we've helped thousands of businesses improve their local rankings, individual results depend on factors including competition, market conditions, and implementation. Testimonials represent real customer experiences but are not typical results.
            </p>
            <p>
              <strong className="text-gray-500">ARBITRATION CLAUSE:</strong> Any disputes arising from this service will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive your right to a jury trial or to participate in a class action lawsuit.
            </p>
            <p>
              <strong className="text-gray-500">FTC DISCLOSURE:</strong> We may receive compensation for products or services recommended. All earnings claims are based on actual customer data but are not guaranteed. Your results may differ.
            </p>
            <p>
              <strong className="text-gray-500">GOOGLE DISCLAIMER:</strong> LocalRank.ai is not affiliated with, endorsed by, or sponsored by Google LLC. Google My Business and Google Maps are trademarks of Google LLC. Our service provides third-party optimization tools that comply with Google's Terms of Service.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-600 text-[10px] pt-3 border-t border-gray-800">
            <p>© {new Date().getFullYear()} LocalRank.ai. All rights reserved.</p>
            <p className="mt-0.5">Made with ❤️ for local business owners</p>
          </div>
        </div>
      </div>
    </footer>
  );
}