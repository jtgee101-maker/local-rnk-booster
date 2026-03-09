import React from 'react';
import { createPageUrl } from '@/utils';
import { Zap, MapPin, ArrowRight } from 'lucide-react';

const CITIES = [
  { city: 'Austin', state: 'TX' }, { city: 'Dallas', state: 'TX' }, { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' }, { city: 'Denver', state: 'CO' }, { city: 'Atlanta', state: 'GA' },
  { city: 'Charlotte', state: 'NC' }, { city: 'Nashville', state: 'TN' }, { city: 'Tampa', state: 'FL' },
  { city: 'Orlando', state: 'FL' }, { city: 'Seattle', state: 'WA' }, { city: 'Portland', state: 'OR' },
  { city: 'Minneapolis', state: 'MN' }, { city: 'Columbus', state: 'OH' }, { city: 'Indianapolis', state: 'IN' },
];

const INDUSTRIES = [
  { key: 'hvac', label: 'HVAC', icon: '🌡️' },
  { key: 'plumber', label: 'Plumber', icon: '🔧' },
  { key: 'roofing', label: 'Roofing', icon: '🏠' },
  { key: 'electrician', label: 'Electrician', icon: '⚡' },
  { key: 'landscaping', label: 'Landscaping', icon: '🌿' },
  { key: 'dentist', label: 'Dentist', icon: '🦷' },
  { key: 'contractor', label: 'Contractor', icon: '🏗️' },
  { key: 'auto_repair', label: 'Auto Repair', icon: '🔩' },
  { key: 'chiropractor', label: 'Chiropractor', icon: '🩺' },
];

const BG = '#0a0a0f';
const BG_CARD = '#111118';
const BG_BORDER = '#1f2937';
const BRAND_GREEN = '#c8ff00';

function landingUrl(city, industry) {
  return createPageUrl('CityNicheLanding') + `?city=${encodeURIComponent(city.toLowerCase())}&industry=${encodeURIComponent(industry)}`;
}

export default function SEOAuditIndex() {
  return (
    <div style={{ backgroundColor: BG, color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Hero */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Free Local SEO Audits by City & Industry
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
            Select your industry and city to see exactly why your business isn't ranking — and how to fix it in 60 seconds.
          </p>
          <a
            href={createPageUrl('QuizGeenius')}
            style={{ background: BRAND_GREEN, color: '#0a0a0f', padding: '16px 40px', borderRadius: 10, fontWeight: 700, fontSize: 18, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            <Zap size={20} /> Run Your Free Audit
          </a>
        </div>
      </section>

      {/* Industry Grid */}
      <section style={{ padding: '60px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>Browse by Industry</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {INDUSTRIES.map(({ key, label, icon }) => (
            <a
              key={key}
              href={landingUrl('austin', key)}
              style={{ background: BG_CARD, border: `1px solid ${BG_BORDER}`, borderRadius: 12, padding: '24px 20px', textDecoration: 'none', color: '#fff', textAlign: 'center', display: 'block', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = BRAND_GREEN}
              onMouseLeave={e => e.currentTarget.style.borderColor = BG_BORDER}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                Free audit <ArrowRight size={12} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* City × Industry Grid */}
      <section style={{ padding: '60px 20px', background: '#0f0f1a', borderTop: `1px solid ${BG_BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Browse by City & Industry</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 40 }}>
            {CITIES.length} cities × {INDUSTRIES.length} industries = {CITIES.length * INDUSTRIES.length} targeted pages
          </p>

          {INDUSTRIES.map(({ key, label, icon }) => (
            <div key={key} style={{ marginBottom: 48 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{icon}</span> {label} SEO Audits
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CITIES.map(({ city, state }) => (
                  <a
                    key={city}
                    href={landingUrl(city, key)}
                    style={{ background: BG_CARD, border: `1px solid ${BG_BORDER}`, borderRadius: 8, padding: '8px 16px', fontSize: 14, color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND_GREEN; e.currentTarget.style.color = BRAND_GREEN; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BG_BORDER; e.currentTarget.style.color = '#d1d5db'; }}
                  >
                    <MapPin size={12} /> {label} SEO Audit {city}, {state}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ color: '#6b7280', fontSize: 14 }}>{CITIES.length} cities × {INDUSTRIES.length} industries = {CITIES.length * INDUSTRIES.length} targeted audit pages</p>
          </div>
        </div>
      </section>

    </div>
  );
}