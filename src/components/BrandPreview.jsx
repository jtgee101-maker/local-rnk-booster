import React from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  Zap,
  ArrowRight,
  CheckCircle2,
  Menu,
  Bell,
  Search,
  Home,
  Settings,
  HelpCircle
} from 'lucide-react';

/**
 * BrandPreview Component
 * 
 * Displays a live preview of the brand configuration with three view modes:
 * - Landing: Shows the landing page preview
 * - Dashboard: Shows the dashboard preview
 * - Mobile: Shows mobile-responsive view
 * 
 * How the live preview works:
 * 1. Receives config object from parent BrandEditor component
 * 2. Applies brand colors, typography, and settings via inline styles
 * 3. Uses CSS custom properties for dynamic theming
 * 4. Re-renders automatically when config changes (React state propagation)
 * 5. Preview components use the config values for colors, fonts, and text
 */

export default function BrandPreview({ config, activeTab }) {
  // Generate CSS custom properties from config
  const cssVariables = {
    '--brand-primary': config.colors.primary,
    '--brand-secondary': config.colors.secondary,
    '--brand-accent': config.colors.accent,
    '--brand-background': config.colors.background,
    '--brand-text': config.colors.text,
    '--brand-font-family': config.typography.fontFamily,
    '--brand-heading-size': `${config.typography.headingSize}px`,
    '--brand-body-size': `${config.typography.bodySize}px`,
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-950"
      style={cssVariables}
    >
      {/* Device Frame */}
      <div
        className={cn(
          'mx-auto transition-all duration-300',
          activeTab === 'mobile'
            ? 'max-w-[375px] border-x-8 border-gray-800 rounded-[2rem] overflow-hidden'
            : 'w-full'
        )}
      >
        {/* Preview Content */}
        <div
          className="min-h-[500px] max-h-[600px] overflow-y-auto"
          style={{
            backgroundColor: config.colors.background,
            fontFamily: config.typography.fontFamily,
            fontSize: config.typography.bodySize,
          }}
        >
          {activeTab === 'landing' && <LandingPagePreview config={config} />}
          {activeTab === 'dashboard' && <DashboardPreview config={config} />}
          {activeTab === 'mobile' && <MobilePreview config={config} />}
        </div>
      </div>

      {/* Preview Label */}
      <div className="absolute bottom-3 right-3">
        <span className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-900/90 rounded-full border border-gray-800">
          {activeTab === 'landing' && 'Landing Page Preview'}
          {activeTab === 'dashboard' && 'Dashboard Preview'}
          {activeTab === 'mobile' && 'Mobile Preview'}
        </span>
      </div>
    </div>
  );
}

// Landing Page Preview Component
function LandingPagePreview({ config }) {
  return (
    <div className="w-full">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          backgroundColor: config.colors.secondary,
          borderColor: `${config.colors.text}10`,
        }}
      >
        <div className="flex items-center gap-2">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{
                backgroundColor: config.colors.primary,
                color: config.colors.secondary,
              }}
            >
              {config.brandName.charAt(0)}
            </div>
          )}
          <span
            className="font-semibold text-lg"
            style={{ color: config.colors.text }}
          >
            {config.brandName}
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          {['Features', 'Pricing', 'About'].map((item) => (
            <span
              key={item}
              className="text-sm opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
              style={{ color: config.colors.text }}
            >
              {item}
            </span>
          ))}
        </nav>
        <button
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90"
          style={{
            backgroundColor: config.colors.primary,
            color: config.colors.secondary,
          }}
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 sm:py-16 text-center">
        <h1
          className="font-bold mb-4 leading-tight"
          style={{
            color: config.colors.text,
            fontSize: `${config.typography.headingSize}px`,
          }}
        >
          {config.tagline}
        </h1>
        <p
          className="max-w-lg mx-auto mb-8 opacity-70"
          style={{
            color: config.colors.text,
            fontSize: config.typography.bodySize,
          }}
        >
          Transform your local business with powerful SEO tools, review management,
          and analytics that drive real results.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{
              backgroundColor: config.colors.primary,
              color: config.colors.secondary,
            }}
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="px-6 py-3 rounded-lg font-medium border transition-all hover:opacity-90"
            style={{
              borderColor: `${config.colors.text}30`,
              color: config.colors.text,
            }}
          >
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Star, title: 'Review Management', desc: 'Monitor and respond to reviews' },
            { icon: TrendingUp, title: 'SEO Optimization', desc: 'Rank higher in local search' },
            { icon: BarChart3, title: 'Analytics', desc: 'Track your performance' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border transition-all hover:scale-105"
              style={{
                backgroundColor: `${config.colors.secondary}50`,
                borderColor: `${config.colors.text}10`,
              }}
            >
              <feature.icon
                className="w-8 h-8 mb-3"
                style={{ color: config.colors.primary }}
              />
              <h3
                className="font-semibold mb-1"
                style={{ color: config.colors.text }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm opacity-60"
                style={{ color: config.colors.text }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section
        className="px-6 py-8 border-t"
        style={{ borderColor: `${config.colors.text}10` }}
      >
        <div className="flex items-center justify-center gap-8 opacity-50">
          {['Google', 'Yelp', 'Facebook', 'Bing'].map((partner) => (
            <span
              key={partner}
              className="text-sm font-medium"
              style={{ color: config.colors.text }}
            >
              {partner}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// Dashboard Preview Component
function DashboardPreview({ config }) {
  return (
    <div className="flex h-full min-h-[500px]">
      {/* Sidebar */}
      <aside
        className="w-16 sm:w-56 flex-shrink-0 border-r flex flex-col"
        style={{
          backgroundColor: config.colors.secondary,
          borderColor: `${config.colors.text}10`,
        }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: `${config.colors.text}10` }}>
          <div className="flex items-center gap-2">
            {config.logo ? (
              <img src={config.logo} alt="Logo" className="h-6 object-contain" />
            ) : (
              <div
                className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: config.colors.primary,
                  color: config.colors.secondary,
                }}
              >
                {config.brandName.charAt(0)}
              </div>
            )}
            <span
              className="font-semibold hidden sm:block"
              style={{ color: config.colors.text }}
            >
              {config.brandName}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BarChart3, label: 'Analytics', active: false },
            { icon: Users, label: 'Leads', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: item.active ? `${config.colors.primary}20` : 'transparent',
                color: item.active ? config.colors.primary : config.colors.text,
              }}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden sm:block text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            backgroundColor: config.colors.background,
            borderColor: `${config.colors.text}10`,
          }}
        >
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 sm:hidden" style={{ color: config.colors.text }} />
            <span
              className="font-medium hidden sm:block"
              style={{ color: config.colors.text }}
            >
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg transition-all"
              style={{ color: config.colors.text }}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg transition-all relative"
              style={{ color: config.colors.text }}
            >
              <Bell className="w-5 h-5" />
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: config.colors.accent }}
              />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: config.colors.primary,
                color: config.colors.secondary,
              }}
            >
              JD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1
              className="font-bold mb-1"
              style={{
                color: config.colors.text,
                fontSize: `${config.typography.headingSize * 0.6}px`,
              }}
            >
              Welcome back, John!
            </h1>
            <p
              className="opacity-60"
              style={{ color: config.colors.text }}
            >
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Leads', value: '2,847', change: '+12%' },
              { label: 'Conversion', value: '24.5%', change: '+3%' },
              { label: 'Reviews', value: '4.9', change: '+0.2' },
              { label: 'Revenue', value: '$12.4k', change: '+8%' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: `${config.colors.secondary}30`,
                  borderColor: `${config.colors.text}10`,
                }}
              >
                <p
                  className="text-xs opacity-60 mb-1"
                  style={{ color: config.colors.text }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: config.colors.text }}
                >
                  {stat.value}
                </p>
                <span
                  className="text-xs"
                  style={{ color: config.colors.primary }}
                >
                  {stat.change}
                </span>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div
            className="p-4 rounded-lg border mb-4"
            style={{
              backgroundColor: `${config.colors.secondary}30`,
              borderColor: `${config.colors.text}10`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold"
                style={{ color: config.colors.text }}
              >
                Performance Overview
              </h3>
              <select
                className="text-xs px-2 py-1 rounded border bg-transparent"
                style={{
                  borderColor: `${config.colors.text}20`,
                  color: config.colors.text,
                }}
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="h-32 flex items-end gap-2">
              {[40, 65, 45, 80, 55, 90, 70].map((height, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    backgroundColor: idx === 5 ? config.colors.primary : `${config.colors.primary}40`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: `${config.colors.secondary}30`,
              borderColor: `${config.colors.text}10`,
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: `${config.colors.text}10` }}
            >
              <h3
                className="font-semibold"
                style={{ color: config.colors.text }}
              >
                Recent Activity
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: `${config.colors.text}10` }}>
              {[
                'New lead from Google Ads',
                '5-star review received',
                'Campaign completed',
              ].map((activity, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: config.colors.primary }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: config.colors.text }}
                  >
                    {activity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Mobile Preview Component
function MobilePreview({ config }) {
  return (
    <div className="w-full">
      {/* Mobile Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: config.colors.secondary,
          borderColor: `${config.colors.text}10`,
        }}
      >
        <Menu className="w-5 h-5" style={{ color: config.colors.text }} />
        <div className="flex items-center gap-2">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="h-6 object-contain" />
          ) : (
            <span
              className="font-semibold"
              style={{ color: config.colors.text }}
            >
              {config.brandName}
            </span>
          )}
        </div>
        <Bell className="w-5 h-5" style={{ color: config.colors.text }} />
      </header>

      {/* Mobile Content */}
      <div className="px-4 py-6">
        {/* Welcome */}
        <h1
          className="font-bold mb-2"
          style={{
            color: config.colors.text,
            fontSize: `${config.typography.headingSize * 0.5}px`,
          }}
        >
          Good morning,
          <br />
          <span style={{ color: config.colors.primary }}>John! 👋</span>
        </h1>
        <p
          className="text-sm opacity-60 mb-6"
          style={{ color: config.colors.text }}
        >
          Here's your business overview
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Leads', value: '2,847', icon: Users },
            { label: 'Growth', value: '+24%', icon: TrendingUp },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${config.colors.secondary}50` }}
            >
              <stat.icon
                className="w-5 h-5 mb-2"
                style={{ color: config.colors.primary }}
              />
              <p
                className="text-lg font-bold"
                style={{ color: config.colors.text }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs opacity-60"
                style={{ color: config.colors.text }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="space-y-3 mb-6">
          {[
            { title: 'Review Requests', desc: '3 pending', icon: Star },
            { title: 'New Leads', desc: '12 to review', icon: Zap },
          ].map((action, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: `${config.colors.secondary}30` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${config.colors.primary}20` }}
                >
                  <action.icon
                    className="w-5 h-5"
                    style={{ color: config.colors.primary }}
                  />
                </div>
                <div>
                  <p
                    className="font-medium"
                    style={{ color: config.colors.text }}
                  >
                    {action.title}
                  </p>
                  <p
                    className="text-xs opacity-60"
                    style={{ color: config.colors.text }}
                  >
                    {action.desc}
                  </p>
                </div>
              </div>
              <ArrowRight
                className="w-5 h-5 opacity-40"
                style={{ color: config.colors.text }}
              />
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t flex justify-around"
          style={{
            backgroundColor: config.colors.secondary,
            borderColor: `${config.colors.text}10`,
          }}
        >
          {[
            { icon: Home, active: true },
            { icon: BarChart3, active: false },
            { icon: HelpCircle, active: false },
            { icon: Settings, active: false },
          ].map((item, idx) => (
            <button
              key={idx}
              className="p-2 rounded-lg"
              style={{
                color: item.active ? config.colors.primary : `${config.colors.text}60`,
              }}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Safe area spacer */}
        <div className="h-16" />
      </div>
    </div>
  );
}
