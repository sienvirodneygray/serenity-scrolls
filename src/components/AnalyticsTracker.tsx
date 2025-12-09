import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'analytics_visitor_id';

const generateVisitorId = (): string => {
  return 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const getVisitorId = (): string => {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = 'desktop';
  if (/mobile/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';

  let browser = 'unknown';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  return { device, browser };
};

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
  };
};

export const AnalyticsTracker = () => {
  const location = useLocation();
  const sessionInitialized = useRef(false);
  const visitorId = useRef<string>('');

  // Initialize session on mount
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    visitorId.current = getVisitorId();
    const { device, browser } = getDeviceInfo();
    const utmParams = getUtmParams();

    const initSession = async () => {
      try {
        // Using type assertion as the types may not be updated yet
        await (supabase.from('analytics_sessions') as any).insert({
          visitor_id: visitorId.current,
          started_at: new Date().toISOString(),
          device_type: device,
          browser,
          referrer: document.referrer || null,
          ...utmParams,
        });
        console.log('[Analytics] Session initialized for visitor:', visitorId.current);
      } catch (error) {
        console.error('[Analytics] Failed to init session:', error);
      }
    };

    initSession();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!visitorId.current) {
      visitorId.current = getVisitorId();
    }

    const trackPageView = async () => {
      try {
        // Using type assertion as the types may not be updated yet
        await (supabase.from('analytics_events') as any).insert({
          visitor_id: visitorId.current,
          event_type: 'page_view',
          page_path: location.pathname,
          event_name: 'page_view',
        });
        console.log('[Analytics] Page view tracked:', location.pathname);
      } catch (error) {
        console.error('[Analytics] Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;
