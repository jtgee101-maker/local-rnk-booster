import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useLocationContent v2
 * 
 * Resolves dynamic hero content based on visitor location using the
 * LocationContentVariant entity (admin-managed, replaces AppSettings approach).
 *
 * Resolution priority: city > state > region > country > default
 * Graceful fallback to default props if no variant matches or on any error.
 * No layout shifts: initial state mirrors the provided defaults.
 */
export default function useLocationContent({
  defaultHeadline,
  defaultHero,
  defaultSubheadline,
  defaultCta,
  pageSlug = ''
} = {}) {
  const [content, setContent] = useState({
    headline: defaultHeadline || null,
    subheadline: defaultSubheadline || null,
    heroImage: defaultHero || null,
    primaryCta: defaultCta || null,
    secondaryCta: null,
    proofSnippet: null,
    trustBarText: null
  });
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectedState, setDetectedState] = useState(null);
  const [variantKey, setVariantKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        // Step 1: Detect location via IP with short timeout
        let city = null;
        let state = null;
        try {
          const ipRes = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(3000)
          });
          if (ipRes.ok) {
            const d = await ipRes.json();
            city  = d.city   || null;
            state = d.region || null;
          }
        } catch (_) { /* silently ignore — use defaults */ }

        setDetectedCity(city);
        setDetectedState(state);

        // Step 2: Load active variants from LocationContentVariant entity
        let variants = [];
        try {
          variants = await base44.entities.LocationContentVariant.filter({ is_active: true });
          // Sort ascending by priority so lower number = checked first
          variants.sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5));
        } catch (_) {
          setLoading(false);
          return;
        }

        if (!variants.length) { setLoading(false); return; }

        const cityLower  = (city  || '').toLowerCase().trim();
        const stateLower = (state || '').toLowerCase().trim();

        // Resolution chain: city → state → region → country → default
        const match = (() => {
          if (cityLower) {
            const m = variants.find(v => v.location_type === 'city' && (v.location_value || '').toLowerCase().trim() === cityLower);
            if (m) return m;
          }
          if (stateLower) {
            const m = variants.find(v => v.location_type === 'state' && (v.location_value || '').toLowerCase().trim() === stateLower);
            if (m) return m;
          }
          const region = variants.find(v => v.location_type === 'region');
          if (region) return region;
          const country = variants.find(v => v.location_type === 'country');
          if (country) return country;
          return variants.find(v => v.location_type === 'default') || null;
        })();

        if (!match) { setLoading(false); return; }

        setVariantKey(match.key || match.id);

        // Token interpolation — only replaces known tokens, tolerant of extras
        const interpolate = (text) => {
          if (!text) return text;
          return text
            .replace(/\{\{city\}\}/g,  city  || '')
            .replace(/\{\{City\}\}/g,  city  || '')
            .replace(/\{\{state\}\}/g, state || '')
            .replace(/\{\{State\}\}/g, state || '');
        };

        setContent({
          headline:     match.headline     ? interpolate(match.headline)     : (defaultHeadline   || null),
          subheadline:  match.subheadline  ? interpolate(match.subheadline)  : (defaultSubheadline || null),
          heroImage:    match.hero_image_url || defaultHero || null,
          primaryCta:   match.primary_cta  ? interpolate(match.primary_cta)  : (defaultCta        || null),
          secondaryCta: match.secondary_cta ? interpolate(match.secondary_cta) : null,
          proofSnippet: match.proof_snippet  ? interpolate(match.proof_snippet)  : null,
          trustBarText: match.trust_bar_text ? interpolate(match.trust_bar_text) : null
        });

      } catch (_) {
        // Any error: silently fall back to defaults — no layout shift
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return {
    ...content,
    // Guaranteed fallback (backward-compatible with v1 callers)
    headline:    content.headline    || defaultHeadline    || null,
    subheadline: content.subheadline || defaultSubheadline || null,
    heroImage:   content.heroImage   || defaultHero        || null,
    detectedCity,
    detectedState,
    variantKey,
    loading
  };
}