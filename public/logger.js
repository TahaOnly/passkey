// Research logging framework
// Provides automatic logging of user interactions to the backend

(function () {
  'use strict';

  const NON_INTERACTION_EVENTS = new Set(['page_loaded', 'page_unloaded', 'session_initialized', 'session_restored']);
  let cachedSessionId = null;
  let currentTask = null;
  let taskStartTime = null;
  let hasLoggedTaskStart = false;

  // Generate UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function initializeSession() {
    const now = new Date().toISOString();
    let sessionId = localStorage.getItem('research.sessionId');
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem('research.sessionId', sessionId);
      sendLog(sessionId, 'system', 'session_initialized', now, {});
    } else {
      sendLog(sessionId, 'system', 'session_restored', now, {});
    }
    return sessionId;
  }

  // Get or create sessionId from localStorage
  function getSessionId() {
    if (!cachedSessionId) {
      cachedSessionId = initializeSession();
    }
    return cachedSessionId;
  }

  // Initialize logger for a specific task
  window.initLogger = function (taskName) {
    currentTask = taskName;
    taskStartTime = null;
    hasLoggedTaskStart = false;
  };

  // Log an event
  window.logEvent = function (eventName, metadata = {}) {
    const sessionId = getSessionId();
    const timestamp = new Date().toISOString();

    // Track task start on first interaction
    if (!hasLoggedTaskStart && currentTask && !NON_INTERACTION_EVENTS.has(eventName)) {
      taskStartTime = Date.now();
      hasLoggedTaskStart = true;
      // Log task_started event
      sendLog(sessionId, currentTask, 'task_started', timestamp, {});
    }

    // Send the actual event
    sendLog(sessionId, currentTask, eventName, timestamp, metadata);
  };

  // Send log to backend
  function sendLog(sessionId, task, event, timestamp, metadata) {
    const logData = {
      sessionId,
      task: task || 'unknown',
      event,
      timestamp,
      metadata,
    };
    const payload = JSON.stringify(logData);

    if (event === 'page_unloaded' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/log', payload);
      return;
    }

    // Send asynchronously (fire and forget)
    fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: event === 'page_unloaded',
    }).catch((err) => {
      // Silently fail - don't interrupt user experience
      console.warn('Failed to log event:', err);
    });
  }

  // Helper to log task completion with duration
  window.logTaskCompletion = function (success = true, additionalMetadata = {}) {
    if (!currentTask) {
      return;
    }

    const durationMs = taskStartTime ? Date.now() - taskStartTime : 0;
    window.logEvent('task_completed', {
      success,
      durationMs,
      ...additionalMetadata,
    });
  };

  // Helper to log task failure
  window.logTaskFailure = function (additionalMetadata = {}) {
    if (!currentTask) {
      return;
    }
    const durationMs = taskStartTime ? Date.now() - taskStartTime : 0;
    window.logEvent('task_failed', {
      success: false,
      durationMs,
      ...additionalMetadata,
    });
  };

  // Auto-detect navigation events
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    window.logEvent('navigation', { type: 'pushState', url: args[2] });
    return originalPushState.apply(history, args);
  };

  history.replaceState = function (...args) {
    window.logEvent('navigation', { type: 'replaceState', url: args[2] });
    return originalReplaceState.apply(history, args);
  };

  window.addEventListener('popstate', () => {
    window.logEvent('navigation', { type: 'popstate', url: window.location.href });
  });

  // Log page load
  window.addEventListener('load', () => {
    if (currentTask) {
      window.logEvent('page_loaded', { url: window.location.href });
    }
  });

  // Log page unload
  window.addEventListener('beforeunload', () => {
    if (currentTask) {
      window.logEvent('page_unloaded', { url: window.location.href });
    }
  });
})();

