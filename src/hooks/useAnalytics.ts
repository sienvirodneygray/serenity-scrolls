import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'analytics_visitor_id';
const SESSION_ID_KEY = 'analytics_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = `v_${generateId()}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function getSessionId(): string {
  const lastActivity = localStorage.getItem('analytics_last_activity');
  const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  
  const now = Date.now();
  const isExpired = lastActivity && (now - parseInt(lastActivity)) > SESSION_TIMEOUT;
  
  if (!existingSessionId || isExpired) {
    const newSessionId = `s_${generateId()}`;
    sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
    return newSessionId;
  }
  
  return existingSessionId;
}

function detectDevice(): { deviceType: string; browser: string; os: string } {
  const ua = navigator.userAgent;
  
  // Device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
  }
  
  // Browser
  let browser = 'unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  // OS
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return { deviceType, browser, os };
}

function getUTMParams(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
}

export function useAnalytics() {
  const location = useLocation();
  const sessionIdRef = useRef<string>('');
  const visitorIdRef = useRef<string>('');
  const pageViewIdRef = useRef<string | null>(null);
  const pageLoadTimeRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);
  const pageCountRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  const initSession = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    visitorIdRef.current = getVisitorId();
    sessionIdRef.current = getSessionId();
    
    const { deviceType, browser, os } = detectDevice();
    const utmParams = getUTMParams();
    
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('analytics_sessions')
      .select('id')
      .eq('session_id', sessionIdRef.current)
      .maybeSingle();
    
    if (!existingSession) {
      await supabase.from('analytics_sessions').insert({
        session_id: sessionIdRef.current,
        visitor_id: visitorIdRef.current,
        device_type: deviceType,
        browser,
        os,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        referrer: document.referrer || null,
        entry_page: location.pathname,
        started_at: new Date().toISOString(),
        is_bounce: true,
        ...utmParams,
      });
    }
    
    localStorage.setItem('analytics_last_activity', Date.now().toString());
  }, [location.pathname]);

  const trackPageView = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    pageLoadTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;
    pageCountRef.current += 1;
    
    const loadTime = performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart;
    
    const { data } = await supabase
      .from('analytics_pageviews')
      .insert({
        session_id: sessionIdRef.current,
        page_path: location.pathname,
        path: location.pathname,
        page_title: document.title,
        load_time_ms: loadTime > 0 ? loadTime : null,
        referrer: document.referrer || null,
      })
      .select('id')
      .single();
    
    if (data) {
      pageViewIdRef.current = data.id;
    }
    
    // Mark as not bounce if this is the second page
    if (pageCountRef.current > 1) {
      await supabase
        .from('analytics_sessions')
        .update({ is_bounce: false })
        .eq('session_id', sessionIdRef.current);
    }
    
    localStorage.setItem('analytics_last_activity', Date.now().toString());
  }, [location.pathname]);

  const updatePageView = useCallback(async () => {
    if (!pageViewIdRef.current) return;
    
    const timeOnPage = Date.now() - pageLoadTimeRef.current;
    
    await supabase
      .from('analytics_pageviews')
      .update({
        time_on_page_ms: timeOnPage,
        time_on_page_seconds: Math.floor(timeOnPage / 1000),
        scroll_depth_percent: maxScrollDepthRef.current,
      })
      .eq('id', pageViewIdRef.current);
  }, []);

  const updateSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    await supabase
      .from('analytics_sessions')
      .update({
        ended_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        exit_page: location.pathname,
        total_pageviews: pageCountRef.current,
      })
      .eq('session_id', sessionIdRef.current);
    
    localStorage.setItem('analytics_last_activity', Date.now().toString());
  }, [location.pathname]);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Track page views on route change
  useEffect(() => {
    if (isInitializedRef.current) {
      // Update previous page view before tracking new one
      updatePageView().then(() => {
        trackPageView();
      });
    }
  }, [location.pathname, trackPageView, updatePageView]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrollDepth = Math.round((window.scrollY / scrollHeight) * 100);
        maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, scrollDepth);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update session every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateSession();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateSession]);

  // Update on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      updatePageView();
      updateSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [updatePageView, updateSession]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updatePageView();
        updateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updatePageView, updateSession]);
}
