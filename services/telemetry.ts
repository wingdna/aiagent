import posthog from 'posthog-js';

// 🛡️ Safe Initialization
const initTelemetry = () => {
  // [MOBILE_OFFLINE_PROTOCOL]
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) {
    console.log('[TELEMETRY] Mobile detected, skipping initialization to reduce TBT.');
    return;
  }

  // Config from Protocol V14.0
  const POSTHOG_KEY = 'phc_UnpileEMkHkBpBlMTMEoITJGHDasys2NevOUQkEhVu'; 
  const POSTHOG_HOST = 'https://us.i.posthog.com';

  if (typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true, // ⚡ KEY: Automatically tracks clicks/inputs
      capture_pageview: false, // We handle this manually for SPAs to ensure accuracy
      persistence: 'localStorage',
      mask_all_text: false,
      person_profiles: 'identified_only', // Optimization
    });
  }
};

// 📍 Route Change Tracker (For SPA)
const trackPageView = (viewName?: string) => {
  posthog.capture('$pageview', {
      $current_url: window.location.href,
      view: viewName
  });
};

export const Telemetry = {
  init: initTelemetry,
  trackPage: trackPageView,
  // Custom event for specific actions
  track: (event: string, properties?: any) => posthog.capture(event, properties),
  identify: (id: string, properties?: any) => posthog.identify(id, properties),
  reset: () => posthog.reset()
};