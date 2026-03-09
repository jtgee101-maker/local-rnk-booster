import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { AlertTriangle, ArrowRight, Zap, MapPin, LayoutGrid } from 'lucide-react';

const INDUSTRY_CONFIG = {
  hvac: {
    label: 'HVAC', labelFull: 'HVAC Company', searches: 2400, avgJobValue: 450, icon: '🌡️',
    problems: ['Missing service area keywords in your GMB description', 'Review count below competitors (they have 80+, you may have far fewer)', 'No seasonal Google Posts in the last 30 days', 'Incomplete business categories set up in your profile'],
    stat: '73% of HVAC calls go to the top 3 Google Map Pack results'
  },
  plumber: {
    label: 'Plumbing', labelFull: 'Plumbing Company', searches: 1800, avgJobValue: 380, icon: '🔧',
    problems: ['No emergency / 24-hour service keywords in your profile', 'Missing before & after photos of completed work', 'Review response rate below 50%', 'Service areas not properly defined in Google'],
    stat: '68% of emergency plumbing calls go to the top 3 Map Pack results'
  },
  roofing: {
    label: 'Roofing', labelFull: 'Roofing Contractor', searches: 1200, avgJobValue: 8500, icon: '🏠',
    problems: ['Missing storm damage and insurance claim keywords', 'No before/after project portfolio photos', 'Incomplete license and insurance credentials', 'Zero Google Posts in the last 60 days'],
    stat: '61% of roofing jobs go to businesses in the top 3 Map Pack'
  },
  electrician: {
    label: 'Electrical', labelFull: 'Electrical Contractor', searches: 1600, avgJobValue: 320, icon: '⚡',
    problems: ['Missing residential vs commercial service differentiation', 'No panel upgrade or EV charger install photos', 'Fewer than 30 reviews on your profile', 'Business hours not set or inaccurate'],
    stat: '70% of electrician searches result in contact with a top 3 business'
  },
  landscaping: {
    label: 'Landscaping', labelFull: 'Landscaping Company', searches: 900, avgJobValue: 650, icon: '🌿',
    problems: ['No seasonal keywords (spring cleanup, fall aeration, snow removal)', 'Missing portfolio photos of completed projects', 'No Google Posts for seasonal promotions', 'Service area radius misconfigured'],
    stat: '65% of landscaping leads contact one of the top 3 Map Pack businesses'
  },
  dentist: {
    label: 'Dental', labelFull: 'Dental Practice', searches: 3200, avgJobValue: 600, icon: '🦷',
    problems: ['Missing insurance accepted and payment options info', 'No new patient special or offer mentioned', 'Review count below 50 (top practices have 200+)', 'Office hours not reflecting actual availability'],
    stat: '75% of new dental patients choose a practice from the top 3 Google results'
  },
  contractor: {
    label: 'General Contracting', labelFull: 'General Contractor', searches: 800, avgJobValue: 12000, icon: '🏗️',
    problems: ['Missing license number and professional credentials', 'No project portfolio photos', 'Fewer than 25 reviews on your profile', 'No service specialization keywords (remodel, addition, etc.)'],
    stat: '58% of contractor searches result in a call to one of the top 3 results'
  },
  auto_repair: {
    label: 'Auto Repair', labelFull: 'Auto Repair Shop', searches: 2100, avgJobValue: 320, icon: '🔩',
    problems: ['Missing make / model service keywords', 'No photos of your shop, team, or equipment', 'Low review count compared to nearby competitors', 'Incorrect or missing service hours'],
    stat: '67% of auto repair searches result in contact with a top 3 business'
  },
  chiropractor: {
    label: 'Chiropractic', labelFull: 'Chiropractic Practice', searches: 1100, avgJobValue: 280, icon: '🩺',
    problems: ['Missing insurance and payment info', 'No new patient welcome offer', 'Review count below 40', 'Incorrect specialty keywords'],
    stat: '71% of chiropractic searches result in contact with a top 3 practice'
  },
};

const DEFAULT_CONFIG = {
  label: 'Local Business', labelFull: 'Local Business', searches: 1500, avgJobValue: 400, icon: '🏪',
  problems: ['Incomplete Google Business Profile', 'Low review count and velocity', 'Missing local service keywords', 'No recent Google Posts'],
  stat: '68% of local searches result in contact with one of the top 3 businesses'
};

const BRAND_GREEN = '#c8ff00';
const BG = '#0a0a0f';
const BG_CARD = '#111118';
const BG_BORDER = '#1f2937';

export default function CityNicheLanding() {
  const [variant, setVariant] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const cityRaw = urlParams.get('city') || '';
  const industryRaw = urlParams.get('industry') || '';

  const city = cityRaw ? (cityRaw.charAt(0).toUpperCase() + cityRaw.slice(1).toLowerCase()) : 'Your City';
  const industryKey = industryRaw.toLowerCase();
  const config = INDUSTRY_CONFIG[industryKey] || DEFAULT_CONFIG;

  useEffect(() => {
    document.title = `Free ${config.label} SEO Audit for ${city} Businesses | LocalRank.ai`;

    // Track page view
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius',
      event_name: 'programmatic_landing_view',
      properties: { city: cityRaw || 'unknown', industry: industryKey || 'unknown', landing_slug: `${cityRaw}-${industryKey}` }
    }).catch(() => {});

    if (!cityRaw || !industryRaw) return;
    base44.entities.LocationContentVariant.filter({ industry: industryKey, location_value: city, is_active: true })
      .then(results => { if (results.length > 0) setVariant(results[0]); })
      .catch(() => {});
  }, [city, industryKey]);

  const headline = variant?.headline || `Free ${config.label} SEO Audit for ${city} Businesses`;
  const subheadline = variant?.subheadline || `Discover why your ${config.labelFull} isn't showing up when ${city} customers search Google — and fix it in 60 seconds.`;
  const ctaText = variant?.primary_cta || `Run My Free ${config.label} Audit`;
  const searchVolume = variant?.search_volume_monthly || config.searches;
  const monthlyLeak = Math.round(searchVolume * 0.13 * config.avgJobValue * 0.28);

  const handleCTA = async () => {
    try {
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'programmatic_cta_clicked',
        properties: { city: cityRaw, industry: industryKey, source: 'city_niche_landing' }
      });
    } catch (e) {}
    const dest = createPageUrl('QuizGeenius') + (cityRaw ? `?city=${encodeURIComponent(cityRaw)}&industry=${encodeURIComponent(industryKey)}&source=seo` : '');
    window.location.href = dest;
  };

  return (
    <div style={{ backgroundColor: BG, color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Hero */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a1a2e', border: `1px solid ${BG_BORDER}`, borderRadius: 24, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: '#9ca3af' }}>
            <MapPin size={14} style={{ color: BRAND_GREEN }} />
            <span>{searchVolume.toLocaleString()} monthly searches · {city} {config.label} market</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.5px' }}>
            {headline}
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', color: '#9ca3af', lineHeight: 1.65, maxWidth: 580, margin: '0 auto 40px' }}>
            {subheadline}
          </p>

          <button
            onClick={handleCTA}
            style={{ background: BRAND_GREEN, color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '18px 44px', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Zap size={20} />
            {ctaText}
          </button>

          <p style={{ marginTop: 14, fontSize: 13, color: '#6b7280' }}>Free · No credit card · Results in 60 seconds</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: '#0f0f1a', borderTop: `1px solid ${BG_BORDER}`, borderBottom: `1px solid ${BG_BORDER}`, padding: '36px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 28, textAlign: 'center' }}>
          {[
            { value: `${searchVolume.toLocaleString()}`, label: 'Monthly local searches', suffix: '/mo' },
            { value: '65%', label: 'Clicks go to top 3 results', suffix: '' },
            { value: `$${monthlyLeak.toLocaleString()}`, label: 'Avg monthly revenue lost', suffix: '' },
            { value: '60', label: 'Seconds to get your score', suffix: 'sec' },
          ].map(({ value, label, suffix }) => (
            <div key={label}>
              <div style={{ fontSize: 34, fontWeight: 800, color: BRAND_GREEN, lineHeight: 1 }}>
                {value}<span style={{ fontSize: 18 }}>{suffix}</span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 700, marginBottom: 14 }}>
              Why Most {config.label} Companies in {city} Don't Rank
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 16 }}>{config.stat}</p>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {config.problems.map((problem, i) => (
              <div key={i} style={{ background: BG_CARD, border: `1px solid #dc262625`, borderLeft: '4px solid #dc2626', borderRadius: 10, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: '#d1d5db', fontSize: 15 }}>{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunity Section */}
      <section style={{ background: '#0f0f1a', padding: '80px 20px', borderTop: `1px solid ${BG_BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 700, marginBottom: 14 }}>
              What Top 3 Ranking Means for Your Business
            </h2>
            <p style={{ color: '#9ca3af' }}>
              {city} Map Pack top 3 positions capture the majority of all calls and leads in your market.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { label: 'Monthly profile clicks', before: `${Math.round(searchVolume * 0.02)}`, after: `${Math.round(searchVolume * 0.22)}+` },
              { label: 'Inbound calls / month', before: '2–4 calls', after: '20–40 calls' },
              { label: 'Monthly revenue recovered', before: '$0', after: `$${monthlyLeak.toLocaleString()}+` },
            ].map(({ label, before, after }) => (
              <div key={label} style={{ background: BG_CARD, borderRadius: 12, padding: '24px', border: `1px solid ${BG_BORDER}` }}>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>NOW</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{before}</div>
                  </div>
                  <ArrowRight size={18} style={{ color: BRAND_GREEN }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>TOP 3</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: BRAND_GREEN }}>{after}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 700, marginBottom: 56 }}>
            Get Your Score in 3 Steps
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
            {[
              { step: '01', title: 'Find Your Business', desc: 'Search your business name on Google Maps. Takes about 10 seconds.' },
              { step: '02', title: 'Get Your Audit Score', desc: 'Our AI analyzes your GMB profile, reviews, photos, and local ranking signals.' },
              { step: '03', title: 'See Your Fix Plan', desc: 'Get a prioritized list of exactly what to fix to climb the rankings in ' + city + '.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${BRAND_GREEN}18`, border: `2px solid ${BRAND_GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 15, fontWeight: 700, color: BRAND_GREEN }}>
                  {step}
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: 10, fontSize: 17 }}>{title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ background: '#0f0f1a', padding: '60px 20px', borderTop: `1px solid ${BG_BORDER}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { quote: `We went from page 2 to the top 3 Map Pack in 8 weeks. Calls doubled.`, author: 'Mike T.', biz: 'HVAC · Austin, TX' },
              { quote: `LocalRank found 6 issues I didn't know existed. Fixed them, ranking jumped.`, author: 'Sarah K.', biz: 'Plumbing · Dallas, TX' },
            ].map(({ quote, author, biz }) => (
              <div key={author} style={{ background: BG_CARD, borderRadius: 12, padding: 24, border: `1px solid ${BG_BORDER}` }}>
                <div style={{ fontSize: 24, color: BRAND_GREEN, marginBottom: 12 }}>"</div>
                <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.65, marginBottom: 16 }}>{quote}</p>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{author}</span> · {biz}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal linking — back to hub */}
      <section style={{ padding: '24px 20px', borderTop: `1px solid ${BG_BORDER}`, textAlign: 'center' }}>
        <a
          href={createPageUrl('SEOAuditIndex')}
          style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = BRAND_GREEN}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
        >
          <LayoutGrid size={14} /> Browse all city & industry audits
        </a>
      </section>

      {/* Final CTA */}
      <section style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%)', padding: '100px 20px', textAlign: 'center', borderTop: `1px solid ${BG_BORDER}` }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>{config.icon}</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.5px' }}>
            Find Out Where You Stand in {city}
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: 40, fontSize: 18, lineHeight: 1.6 }}>
            Run your free {config.label.toLowerCase()} SEO audit and get a personalized score — takes 60 seconds.
          </p>

          <button
            onClick={handleCTA}
            style={{ background: BRAND_GREEN, color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '20px 52px', fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Zap size={22} />
            Run My Free Audit
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 24, flexWrap: 'wrap' }}>
            {['✓ Free forever', '✓ No credit card', '✓ Results in 60 sec'].map(item => (
              <span key={item} style={{ color: '#6b7280', fontSize: 14 }}>{item}</span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}