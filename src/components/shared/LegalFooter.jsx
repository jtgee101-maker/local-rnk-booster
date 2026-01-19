import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, Lock, FileText } from 'lucide-react';

export default function LegalFooter() {
  return (
    <footer className="border-t border-gray-800 bg-[#0a0a0f] mt-20">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-gray-800">
        <div className="flex flex-wrap justify-center gap-8 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4 text-green-500" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <FileText className="w-4 h-4 text-[#c8ff00]" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>🔒</span>
            <span>PCI DSS Certified</span>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold mb-4">LocalRank.ai</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered GMB optimization software helping 7M+ local businesses dominate their markets.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>support@localrank.ai</li>
              <li>Available 24/7</li>
              <li>Response within 2 hours</li>
            </ul>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="border-t border-gray-800 pt-8 space-y-4">
          <div className="text-gray-500 text-xs leading-relaxed">
            <p className="mb-3">
              <strong className="text-gray-400">REFUND POLICY:</strong> We offer a 30-day money-back guarantee on all purchases. If you're not satisfied with our service, contact support@localrank.ai within 30 days for a full refund. Refunds are processed within 5-7 business days.
            </p>
            <p className="mb-3">
              <strong className="text-gray-400">DISCLAIMER:</strong> Results may vary. While we've helped thousands of businesses improve their local rankings, individual results depend on factors including competition, market conditions, and implementation. Testimonials represent real customer experiences but are not typical results.
            </p>
            <p className="mb-3">
              <strong className="text-gray-400">ARBITRATION CLAUSE:</strong> Any disputes arising from this service will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive your right to a jury trial or to participate in a class action lawsuit.
            </p>
            <p className="mb-3">
              <strong className="text-gray-400">FTC DISCLOSURE:</strong> We may receive compensation for products or services recommended. All earnings claims are based on actual customer data but are not guaranteed. Your results may differ.
            </p>
            <p>
              <strong className="text-gray-400">GOOGLE DISCLAIMER:</strong> LocalRank.ai is not affiliated with, endorsed by, or sponsored by Google LLC. Google My Business and Google Maps are trademarks of Google LLC. Our service provides third-party optimization tools that comply with Google's Terms of Service.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-600 text-xs pt-4 border-t border-gray-800">
            <p>© {new Date().getFullYear()} LocalRank.ai. All rights reserved.</p>
            <p className="mt-1">Made with ❤️ for local business owners</p>
          </div>
        </div>
      </div>
    </footer>
  );
}