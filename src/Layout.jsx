import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Pages that should have full-width dark layout (quiz, checkout, etc)
  const fullWidthPages = ['Quiz', 'QuizV2', 'QuizV3', 'Checkout', 'CheckoutV2', 'Upsell', 'Upsell1', 'Pricing', 'BridgeV3', 'ThankYou'];
  const isFullWidth = fullWidthPages.includes(currentPageName);

  // Pages that shouldn't show nav (funnel pages)
  const noNavPages = ['Quiz', 'QuizV2', 'QuizV3', 'Checkout', 'CheckoutV2', 'Upsell', 'Upsell1', 'BridgeV3', 'ThankYou', 'QuizGeenius', 'ResultsGeenius', 'BridgeGeenius', 'FoxyAuditLanding'];
  const showNav = !noNavPages.includes(currentPageName);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === 'admin');
      } catch (error) {
        setIsAdmin(false);
      }
    };
    if (showNav) {
      checkAdmin();
    }
  }, [showNav]);

  const navLinks = [
    { name: 'Home', path: createPageUrl('QuizGeenius') },
    { name: 'Industries', path: createPageUrl('PlumbersLanding'), dropdown: true },
    { name: 'Pricing', path: createPageUrl('Pricing') },
    { name: 'Referrals', path: createPageUrl('Referrals') }
  ];

  const adminTools = [
    { name: 'Production Checklist', path: createPageUrl('ProductionChecklist') },
    { name: 'Security Audit', path: createPageUrl('SecurityAudit') },
    { name: 'Data Cleanup', path: createPageUrl('DataCleanup') },
    { name: 'Stripe Setup', path: createPageUrl('StripeSetupGuide') },
    { name: 'Final Launch', path: createPageUrl('FinalLaunchChecklist') },
    { name: 'Admin Dashboard', path: createPageUrl('AdminControlCenter') }
  ];

  const industryPages = [
      { name: 'Plumbers', path: createPageUrl('PlumbersLanding') },
      { name: 'Electricians', path: createPageUrl('ElectriciansLanding') },
      { name: 'HVAC', path: createPageUrl('HVACLanding') },
      { name: 'Contractors', path: createPageUrl('ContractorsLanding') },
      { name: 'Roofers', path: createPageUrl('RoofersLanding') },
      { name: 'Chiropractors', path: createPageUrl('ChiropractorLanding') },
      { name: 'Dentists', path: createPageUrl('DentistsLanding') },
      { name: 'Auto Repair', path: createPageUrl('AutoRepairLanding') },
      { name: 'Auto Body', path: createPageUrl('AutoBodyLanding') },
      { name: 'Landscaping', path: createPageUrl('LandscapingLanding') },
      { name: 'Lawn Care', path: createPageUrl('LawnCareLanding') },
      { name: 'Power Washing', path: createPageUrl('PowerWashingLanding') },
      { name: 'Handyman', path: createPageUrl('HandymanLanding') },
      { name: 'Real Estate', path: createPageUrl('RealEstateLanding') },
      { name: 'Restaurants', path: createPageUrl('RestaurantsLanding') },
      { name: 'Legal', path: createPageUrl('LegalLanding') }
    ];

  if (!showNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="relative z-50 border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('QuizGeenius')} className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#c8ff00]" />
              <span className="text-[#c8ff00] font-bold text-xl tracking-tight">
                LocalRank<span className="text-white">.ai</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                link.dropdown ? (
                  <div key={link.name} className="relative group">
                    <button className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                      {link.adminOnly && <Settings className="w-4 h-4" />}
                      {link.name}
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      {(link.adminOnly ? adminTools : industryPages).map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <Button
                onClick={() => window.location.href = createPageUrl('QuizGeenius')}
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-semibold"
              >
                Free Audit
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-[#0a0a0f]">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                link.dropdown ? (
                  <div key={link.name}>
                    <div className="text-gray-400 text-sm font-semibold mb-2 flex items-center gap-1">
                      {link.adminOnly && <Settings className="w-4 h-4" />}
                      {link.name}
                    </div>
                    <div className="pl-4 space-y-2">
                      {(link.adminOnly ? adminTools : industryPages).map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block text-gray-300 hover:text-white py-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="block text-gray-300 hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <Button
                onClick={() => {
                  window.location.href = createPageUrl('QuizGeenius');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-semibold"
              >
                Free Audit
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main>{children}</main>

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#c8ff00]" />
                <span className="text-[#c8ff00] font-bold text-lg">
                  LocalRank<span className="text-white">.ai</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered GMB optimization for local businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('QuizGeenius')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Free Audit
                </Link>
                <Link to={createPageUrl('Pricing')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Pricing
                </Link>
                <Link to={createPageUrl('Referrals')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Referral Program
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Documentation</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('DocsHome')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  All Docs & Guides
                </Link>
                <Link to={createPageUrl('GuideQuizGeenius')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  QuizGeenius Flow
                </Link>
                <Link to={createPageUrl('Roadmap')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  12-Month Roadmap
                </Link>
                <Link to={createPageUrl('Features')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Features
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Industries</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('PlumbersLanding')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Plumbers
                </Link>
                <Link to={createPageUrl('ElectriciansLanding')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Electricians
                </Link>
                <Link to={createPageUrl('HVACLanding')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  HVAC
                </Link>
                <Link to={createPageUrl('ContractorsLanding')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Contractors
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Privacy')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link to={createPageUrl('Terms')} className="block text-gray-400 hover:text-[#c8ff00] text-sm transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800/50 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} LocalRank.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}