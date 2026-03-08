import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Zap, Settings, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { OfflineBanner } from '@/components/OfflineBanner';
// Brand colors - inline config until BrandConfig is fixed
const colors = {
  brand: {
    DEFAULT: '#c8ff00',
    foreground: '#0a0a0f'
  },
  background: {
    primary: '#0a0a0f',
    secondary: '#1a1a2e'
  },
  text: {
    primary: '#ffffff',
    secondary: '#d1d5db',
    muted: '#9ca3af'
  },
  border: {
    DEFAULT: '#374151',
    glass: '1px solid rgba(255, 255, 255, 0.1)'
  }
};

/**
 * Layout Component - Unified Navigation
 * 
 * Handles three user types:
 * 1. Normal visitors - Landing pages, quiz flow
 * 2. Authenticated users - Dashboard, tools
 * 3. Admin users - God Mode, system tools
 */

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pages with special layouts
  const fullWidthPages = ['Quiz', 'QuizV2', 'QuizV3', 'Checkout', 'CheckoutV2', 'Upsell', 'Upsell1', 'Pricing', 'BridgeV3', 'ThankYou', 'GodModeDashboard'];
  const isFullWidth = fullWidthPages.includes(currentPageName);

  // Pages that hide navigation (funnel pages)
  const noNavPages = ['Quiz', 'QuizV2', 'QuizV3', 'Checkout', 'CheckoutV2', 'Upsell', 'Upsell1', 'BridgeV3', 'ThankYou', 'QuizGeenius', 'ResultsGeenius', 'BridgeGeenius', 'FoxyAuditLanding'];
  const showNav = !noNavPages.includes(currentPageName);

  // Check if current page is admin-only
  const adminPages = ['GodModeDashboard', 'AdminControlCenter', 'ProductionChecklist', 'SecurityAudit', 'DataCleanup', 'StripeSetupGuide', 'FinalLaunchChecklist', 'FeatureFlags', 'TenantManager', 'SystemHealth', 'APILogs', 'AdminSystem', 'AdminJobs', 'ChaosTestDashboard'];
  const isAdminPage = adminPages.includes(currentPageName);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.role === 'admin' || currentUser?.role === 'superadmin');
      } catch (error) {
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  // Navigation configs by user type
  const publicNav = [
    { name: 'Home', path: createPageUrl('QuizGeenius') },
    { name: 'Industries', path: createPageUrl('PlumbersLanding'), dropdown: true, items: 'industries' },
    { name: 'Pricing', path: createPageUrl('Pricing') },
    { name: 'Referrals', path: createPageUrl('Referrals') }
  ];

  const userNav = [
    { name: 'Dashboard', path: createPageUrl('ClientDashboard') },
    { name: 'My Progress', path: createPageUrl('Dashboard') },
    { name: 'Audits', path: createPageUrl('GMBAudit') },
    { name: 'Reports', path: createPageUrl('Reports') },
    { name: 'Settings', path: createPageUrl('Settings') }
  ];

  const adminNav = [
    { name: '🏛️ God Mode', path: createPageUrl('GodModeDashboard'), highlight: true },
    { name: 'Admin', path: createPageUrl('AdminControlCenter'), dropdown: true, items: 'admin' },
    { name: 'System', path: createPageUrl('ProductionChecklist'), dropdown: true, items: 'system' }
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

  const adminTools = [
    { name: 'Admin Control Center', path: createPageUrl('AdminControlCenter') },
    { name: 'Production Checklist', path: createPageUrl('ProductionChecklist') },
    { name: 'Security Audit', path: createPageUrl('SecurityAudit') },
    { name: 'Data Cleanup', path: createPageUrl('DataCleanup') },
    { name: 'Stripe Setup', path: createPageUrl('StripeSetupGuide') },
    { name: 'Final Launch', path: createPageUrl('FinalLaunchChecklist') }
  ];

  const systemTools = [
    { name: 'Feature Flags', path: createPageUrl('FeatureFlags') },
    { name: 'Tenant Manager', path: createPageUrl('TenantManager') },
    { name: 'System Health', path: createPageUrl('SystemHealth') },
    { name: 'API Logs', path: createPageUrl('APILogs') },
    { name: 'System Monitor', path: createPageUrl('AdminSystem') },
    { name: 'Job Queue', path: createPageUrl('AdminJobs') }
  ];

  // Determine which nav to show
  const getNavItems = () => {
    if (isAdmin) return adminNav;
    if (user) return userNav;
    return publicNav;
  };

  const navItems = getNavItems();

  // Redirect non-admins from admin pages
  useEffect(() => {
    if (!loading && isAdminPage && !isAdmin) {
      window.location.href = createPageUrl('QuizGeenius');
    }
  }, [loading, isAdmin, isAdminPage]);

  if (!showNav) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.primary }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.brand.DEFAULT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.primary }}>
      {/* Navigation */}
      <nav 
        className="relative z-[100] border-b border-gray-800/50 backdrop-blur-sm"
        style={{ backgroundColor: `${colors.background.primary}80` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('QuizGeenius')} className="flex items-center gap-2">
              <Zap className="w-6 h-6" style={{ color: colors.brand.DEFAULT }} />
              <span className="font-bold text-xl tracking-tight" style={{ color: colors.brand.DEFAULT }}>
                LocalRank<span className="text-white">.ai</span>
              </span>
              {isAdmin && (
                <Crown className="w-4 h-4 ml-1" style={{ color: colors.brand.DEFAULT }} />
              )}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((link) => (
                link.dropdown ? (
                  <div key={link.name} className="relative group">
                    <button 
                      className="transition-colors flex items-center gap-1"
                      style={{ color: colors.text.secondary }}
                    >
                      {link.highlight && <Crown className="w-4 h-4" style={{ color: colors.brand.DEFAULT }} />}
                      <span style={link.highlight ? { color: colors.brand.DEFAULT } : {}}>{link.name}</span>
                    </button>
                    <div 
                      className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]"
                      style={{ 
                        backgroundColor: colors.background.secondary,
                        border: colors.border.glass
                      }}
                    >
                      {link.items === 'industries' && industryPages.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                          style={{ color: colors.text.secondary }}
                          onMouseEnter={(e) => e.target.style.color = colors.brand.DEFAULT}
                          onMouseLeave={(e) => e.target.style.color = colors.text.secondary}
                        >
                          {item.name}
                        </Link>
                      ))}
                      {link.items === 'admin' && adminTools.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                          style={{ color: colors.text.secondary }}
                          onMouseEnter={(e) => e.target.style.color = colors.brand.DEFAULT}
                          onMouseLeave={(e) => e.target.style.color = colors.text.secondary}
                        >
                          {item.name}
                        </Link>
                      ))}
                      {link.items === 'system' && systemTools.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                          style={{ color: colors.text.secondary }}
                          onMouseEnter={(e) => e.target.style.color = colors.brand.DEFAULT}
                          onMouseLeave={(e) => e.target.style.color = colors.text.secondary}
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
                    className="transition-colors flex items-center gap-1 font-medium"
                    style={{ color: link.highlight ? colors.brand.DEFAULT : colors.text.secondary }}
                    onMouseEnter={(e) => {
                      if (!link.highlight) {
                        e.currentTarget.style.color = colors.text.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!link.highlight) {
                        e.currentTarget.style.color = colors.text.secondary;
                      }
                    }}
                  >
                    {link.highlight && <Crown className="w-4 h-4" />}
                    {link.name}
                  </Link>
                )
              ))}
              
              {/* CTA Button for public users */}
              {!user && (
                <Button
                  onClick={() => window.location.href = createPageUrl('QuizGeenius')}
                  style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
                  className="font-semibold"
                >
                  Free Audit
                </Button>
              )}
              
              {/* User menu for authenticated users */}
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: colors.text.muted }}>
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => base44.auth.logout()}
                    style={{ borderColor: colors.border.DEFAULT, color: colors.text.secondary }}
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              style={{ color: colors.text.secondary }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden border-t border-gray-800 relative z-[9999]"
            style={{ backgroundColor: colors.background.primary }}
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((link) => (
                link.dropdown ? (
                  <div key={link.name}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: colors.text.muted }}>
                      {link.name}
                    </div>
                    <div className="pl-4 space-y-2">
                      {(link.items === 'industries' ? industryPages : 
                        link.items === 'admin' ? adminTools : systemTools).map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block py-1 transition-colors"
                          style={{ color: colors.text.secondary }}
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
                    className="block py-2 transition-colors"
                    style={{ color: link.highlight ? colors.brand.DEFAULT : colors.text.secondary }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.highlight && <Crown className="w-4 h-4 inline mr-1" />}
                    {link.name}
                  </Link>
                )
              ))}
              
              {!user && (
                <Button
                  onClick={() => {
                    window.location.href = createPageUrl('QuizGeenius');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full font-semibold"
                  style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
                >
                  Free Audit
                </Button>
              )}
              
              {user && (
                <Button
                  variant="outline"
                  onClick={() => {
                    base44.auth.logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className={isFullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Footer (only on non-admin pages) */}
      {!isAdminPage && (
        <footer 
          className="relative border-t border-gray-800/50 backdrop-blur-sm mt-20"
          style={{ backgroundColor: `${colors.background.primary}80` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" style={{ color: colors.brand.DEFAULT }} />
                  <span className="font-bold text-lg" style={{ color: colors.brand.DEFAULT }}>
                    LocalRank<span className="text-white">.ai</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: colors.text.muted }}>
                  AI-powered GMB optimization for local businesses.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl('QuizGeenius')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Free Audit
                  </Link>
                  <Link to={createPageUrl('Pricing')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Pricing
                  </Link>
                  <Link to={createPageUrl('Referrals')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Referral Program
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Documentation</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl('DocsHome')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    All Docs & Guides
                  </Link>
                  <Link to={createPageUrl('GuideQuizGeenius')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    QuizGeenius Flow
                  </Link>
                  <Link to={createPageUrl('Roadmap')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    12-Month Roadmap
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Industries</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl('PlumbersLanding')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Plumbers
                  </Link>
                  <Link to={createPageUrl('ElectriciansLanding')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Electricians
                  </Link>
                  <Link to={createPageUrl('HVACLanding')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    HVAC
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl('Privacy')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Privacy Policy
                  </Link>
                  <Link to={createPageUrl('Terms')} className="block text-sm transition-colors" style={{ color: colors.text.muted }}>
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-800/50 text-center text-sm" style={{ color: colors.text.muted }}>
              © {new Date().getFullYear()} LocalRank.ai. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}