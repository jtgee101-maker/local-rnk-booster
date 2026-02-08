import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RemarketingPixels() {
  const location = useLocation();

  useEffect(() => {
    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Google Ads
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return null;
}

// Facebook Pixel Events
export const trackFBEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

// Google Ads Events
export const trackGoogleAdsEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Combined tracking function
export const trackConversion = (eventName, params = {}) => {
  trackFBEvent(eventName, params);
  trackGoogleAdsEvent(eventName, params);
};

// Initialize pixels (call this once in your app)
export const initializePixels = (fbPixelId, googleAdsId) => {
  // Facebook Pixel
  if (fbPixelId && typeof window !== 'undefined' && !window.fbq) {
    (function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    })(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', fbPixelId);
    window.fbq('track', 'PageView');
  }

  // Google Ads (gtag.js)
  if (googleAdsId && typeof window !== 'undefined' && !window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', googleAdsId);
  }
};