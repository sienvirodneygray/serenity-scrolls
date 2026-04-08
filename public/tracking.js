// Serenity Scrolls Analytics Tracking Script
(function () {
  'use strict';

  const SUPABASE_URL = 'https://ytaporbcmtlidafbssyc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjA4ODksImV4cCI6MjA4ODI5Njg4OX0.OtsXhTimnK_VUcZns-ygq5tFBuQLKYjvhfDPBk9NLlw';

  let sessionId = null;
  let visitorId = null;
  let eventQueue = [];
  let flushTimer = null;
  let pageStartTime = Date.now();
  let maxScrollDepth = 0;
  let lastPagePath = window.location.pathname;

  // Generate or retrieve visitor ID (persists across sessions)
  function getVisitorId() {
    let vid = localStorage.getItem('_analytics_vid');
    if (!vid) {
      vid = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('_analytics_vid', vid);
    }
    return vid;
  }

  // Generate or retrieve session ID
  function getSessionId() {
    let sid = sessionStorage.getItem('_analytics_sid');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('_analytics_sid', sid);
    }
    return sid;
  }

  // Check if returning visitor
  function isReturningVisitor() {
    const hasVisited = localStorage.getItem('_analytics_visited');
    if (!hasVisited) {
      localStorage.setItem('_analytics_visited', 'true');
      return false;
    }
    return true;
  }

  // Get device info
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    if (/mobile/i.test(ua)) deviceType = 'mobile';
    else if (/tablet/i.test(ua)) deviceType = 'tablet';

    let browser = 'unknown';
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';

    let os = 'unknown';
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1) os = 'iOS';

    return {
      deviceType,
      browser,
      os,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }

  // Extract UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }

  // Send data to Supabase
  async function sendToSupabase(table, data) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('Analytics error:', response.statusText);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // Detect country (async, non-blocking)
  async function detectCountry() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return data.country_code || data.country || 'Unknown';
      }
    } catch (e) {
      // Silently fail — country is optional
    }
    return 'Unknown';
  }

  // Update session with country after async lookup
  async function patchSession(sid, country) {
    if (!country || country === 'Unknown') return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/analytics_sessions?session_id=eq.${encodeURIComponent(sid)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ country: country })
      });
    } catch (e) {
      // Non-critical
    }
  }

  // Initialize session
  async function initSession() {
    visitorId = getVisitorId();
    sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();

    const sessionData = {
      session_id: sessionId,
      visitor_id: visitorId,
      first_visit: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_width: deviceInfo.screenWidth,
      screen_height: deviceInfo.screenHeight,
      is_return_visitor: isReturningVisitor(),
      entry_page: window.location.pathname,
      referrer: document.referrer || null,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      total_pageviews: 1,
      total_time_seconds: 0
    };

    await sendToSupabase('analytics_sessions', sessionData);
    trackPageview();

    // Async country detection — patches session after initial insert
    detectCountry().then(country => patchSession(sessionId, country));
  }

  // Track pageview (critical - send immediately)
  async function trackPageview() {
    const pageviewData = {
      session_id: sessionId,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null
    };

    await sendToSupabase('analytics_pageviews', pageviewData);
    pageStartTime = Date.now();
    maxScrollDepth = 0;
  }

  // Queue event (non-critical - batched)
  function queueEvent(eventType, eventData) {
    eventQueue.push({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString()
    });

    // Flush after 10 seconds or 20 events
    if (eventQueue.length >= 20) {
      flushEvents();
    } else if (!flushTimer) {
      flushTimer = setTimeout(flushEvents, 10000);
    }
  }

  // Flush queued events
  async function flushEvents() {
    if (eventQueue.length === 0) return;

    clearTimeout(flushTimer);
    flushTimer = null;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    for (const event of eventsToSend) {
      await sendToSupabase('analytics_events', event);
    }
  }

  // Track scroll depth
  function trackScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
    }
  }

  // Track Amazon button clicks (critical - send immediately)
  window.trackAmazonClick = async function (productName, buttonLocation) {
    const utmParams = getUTMParams();

    const clickData = {
      session_id: sessionId,
      product_name: productName || 'Unknown Product',
      button_location: buttonLocation || window.location.pathname,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      utm_source: utmParams.utm_source,
      utm_campaign: utmParams.utm_campaign
    };

    await sendToSupabase('amazon_clicks', clickData);
  };

  // Track page exit
  async function trackPageExit() {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

    // Update last pageview with time and scroll depth
    queueEvent('page_exit', {
      page_path: lastPagePath,
      time_on_page: timeOnPage,
      scroll_depth: maxScrollDepth
    });

    await flushEvents();
  }

  // Track click with coordinates for heatmap
  async function trackClick(e) {
    const target = e.target.closest('a, button, [data-track]') || e.target;

    const clickData = {
      session_id: sessionId,
      page_path: window.location.pathname,
      click_x: e.clientX,
      click_y: e.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      element_tag: target.tagName,
      element_id: target.id || null,
      element_class: target.className?.toString()?.substring(0, 255) || null,
      element_text: target.textContent?.substring(0, 100) || null,
      timestamp: new Date().toISOString()
    };

    await sendToSupabase('analytics_clicks', clickData);
  }

  // Track user flow (page transitions)
  async function trackUserFlow(fromPage, toPage, transitionTime) {
    const flowData = {
      session_id: sessionId,
      from_page: fromPage,
      to_page: toPage,
      transition_time_ms: transitionTime,
      timestamp: new Date().toISOString()
    };

    await sendToSupabase('analytics_user_flows', flowData);
  }

  // Event listeners
  window.addEventListener('scroll', trackScrollDepth, { passive: true });

  // Track all clicks with coordinates
  document.addEventListener('click', trackClick, true);

  // Handle page unload
  window.addEventListener('beforeunload', trackPageExit);
  window.addEventListener('pagehide', trackPageExit);

  // Handle SPA navigation with user flow tracking
  let lastUrl = location.href;
  let navigationStartTime = Date.now();

  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      const transitionTime = Date.now() - navigationStartTime;
      const fromPage = lastPagePath;

      trackPageExit();
      lastUrl = url;
      lastPagePath = window.location.pathname;

      // Track the flow from previous page to current
      trackUserFlow(fromPage, lastPagePath, transitionTime);

      trackPageview();
      navigationStartTime = Date.now();
    }
  }).observe(document, { subtree: true, childList: true });

  // Initialize
  initSession();
})();
