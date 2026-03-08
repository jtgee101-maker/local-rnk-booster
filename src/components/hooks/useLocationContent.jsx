import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useLocationContent
 * Detects the visitor's location from the browser and returns
 * location-specific headline and hero content if available in AppSettings.
 *
 * Falls back to the default content if nothing is found.
 */
export default function useLocationContent({ defaultHeadline, defaultHero, defaultSubheadline } = {}) {
  const [headline, setHeadline] = useState(defaultHeadline || null);
  const [subheadline, setSubheadline] = useState(defaultSubheadline || null);
  const [heroImage, setHeroImage] = useState(defaultHero || null);
  const [detectedCity, setDetectedCity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        // Try to detect city from browser locale or IP (via free ipapi)
        let city = null;
        let state = null;
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            city = ipData.city || null;
            state = ipData.region || null;
          }
        } catch (_) {
          // silently ignore
        }

        setDetectedCity(city);

        if (!city) {
          setLoading(false);
          return;
        }

        // Look up dynamic content overrides from AppSettings
        const settings = await base44.entities.AppSettings.filter({ setting_key: 'location_content_overrides' }).catch(() => []);

        if (!settings.length) {
          setLoading(false);
          return;
        }

        const overrides = settings[0].setting_value?.overrides || [];
        const cityLower = city.toLowerCase();
        const stateLower = (state || '').toLowerCase();

        // Find best matching override
        const match = overrides.find(o =>
          o.city?.toLowerCase() === cityLower ||
          o.state?.toLowerCase() === stateLower ||
          (o.cities || []).map(c => c.toLowerCase()).includes(cityLower)
        );

        if (match) {
          if (match.headline) setHeadline(match.headline.replace('{{city}}', city).replace('{{state}}', state || ''));
          if (match.subheadline) setSubheadline(match.subheadline.replace('{{city}}', city).replace('{{state}}', state || ''));
          if (match.hero_image) setHeroImage(match.hero_image);
        }
      } catch (_) {
        // silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return {
    headline: headline || defaultHeadline,
    subheadline: subheadline || defaultSubheadline,
    heroImage: heroImage || defaultHero,
    detectedCity,
    loading
  };
}