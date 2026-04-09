import { useEffect, useRef } from 'react';
import { usePathname } from "next/navigation";
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'analytics_visitor_id';

const generateVisitorId = (): string => {
  return 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const getVisitorId = (): string => {
  let visitorId = (typeof window !== 'undefined' ? window.localStorage.getItem.bind(window.localStorage) : () => null)(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    (typeof window !== 'undefined' ? window.localStorage.setItem.bind(window.localStorage) : () => null)(VISITOR_ID_KEY, visitorId);
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
  const pathname = usePathname();
  const sessionInitialized = useRef(false);
  const visitorId = useRef<string>('');
  const sessionId = useRef<string>('');

  // Initialize session on mount
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    visitorId.current = getVisitorId();
    sessionId.current = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const { device, browser } = getDeviceInfo();
    const utmParams = getUtmParams();

    const initSession = async () => {
      try {
        await (supabase.from('analytics_sessions') as any).insert({
          session_id: sessionId.current,
          visitor_id: visitorId.current,
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          device_type: device,
          browser,
          referrer: document.referrer || null,
          ...utmParams,
        });
        console.log('[Analytics] Session initialized:', sessionId.current);
      } catch (error) {
        console.error('[Analytics] Failed to init session:', error);
      }
    };

    initSession();

    // Update ended_at on page unload
    const handleUnload = () => {
      navigator.sendBeacon && (supabase.from('analytics_sessions') as any)
        .update({ ended_at: new Date().toISOString(), last_activity: new Date().toISOString() } as any)
        .eq('session_id', sessionId.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Track page views on route changes and update session activity
  useEffect(() => {
    if (!visitorId.current) {
      visitorId.current = getVisitorId();
    }

    const trackPageView = async () => {
      try {
        const now = new Date().toISOString();
        
        // Insert page view event
        await (supabase.from('analytics_events') as any).insert({
          visitor_id: visitorId.current,
          session_id: sessionId.current,
          event_type: 'page_view',
          page_path: pathname,
          event_name: 'page_view',
        });

        // Update session last_activity and ended_at for duration tracking
        if (sessionId.current) {
          await (supabase.from('analytics_sessions') as any)
            .update({ last_activity: now, ended_at: now } as any)
            .eq('session_id', sessionId.current);
        }

        console.log('[Analytics] Page view tracked:', pathname);
      } catch (error) {
        console.error('[Analytics] Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  return null;
};

export default AnalyticsTracker;
