"use client";

import posthog from "posthog-js";

const DEDUPE_WINDOW_MS = 300;
let lastEventKey = "";
let lastEventTime = 0;

const EVENT_ALIASES = {
  prompt_search: "search_performed",
  prompt_copy_click: "prompt_copied",
  category_filter_click: "category_viewed",
  prompt_card_click: "prompt_viewed",
  prompt_card_title_click: "prompt_viewed",
  prompt_card_unlocked_view_click: "prompt_viewed",
};

const SENSITIVE_KEY_PATTERN = /password|token|secret|authorization|cookie|card|cvv|otp|signature|content|promptText|promptContent|email|avatar|ipAddress|^ip$|latitude|longitude|coordinates|loginHistory|firstReferral|metadata/i;

function stableSerialize(value) {
  if (!value || typeof value !== "object") {
    return String(value ?? "");
  }

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = value[key];
        return accumulator;
      }, {})
  );
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (!eventName) {
    return;
  }

  const eventParams = sanitizeAnalyticsParams({
    site_name: "SeyPrompt",
    ...params
  });
  const eventKey = `${eventName}:${stableSerialize(eventParams)}`;
  const now = Date.now();

  if (eventKey === lastEventKey && now - lastEventTime < DEDUPE_WINDOW_MS) {
    return;
  }

  lastEventKey = eventKey;
  lastEventTime = now;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventParams
    });
  }

  capturePostHogEvent(eventName, eventParams);
  const aliasedEventName = EVENT_ALIASES[eventName];
  if (aliasedEventName && aliasedEventName !== eventName) {
    capturePostHogEvent(aliasedEventName, eventParams);
  }
}

export function setAnalyticsUserIdFromHash(hashedId) {
  if (typeof window === "undefined" || !hashedId) return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_id: hashedId });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ user_id: hashedId });
  if (posthog.__loaded) {
    posthog.identify(hashedId);
  }
}

export function clearAnalyticsUserId() {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_id: null });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ user_id: null });
  if (posthog.__loaded) {
    posthog.reset();
  }
}

export function setAnalyticsUserProperty(hashedId) {
  if (typeof window === "undefined" || !hashedId) return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_properties: { hashed_user_id: hashedId } });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ hashed_user_id: hashedId });
  if (posthog.__loaded) {
    posthog.people.set({ hashed_user_id: hashedId });
  }
}

export function clearAnalyticsUserProperty() {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_properties: { hashed_user_id: null } });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ hashed_user_id: null });
}

function sanitizeAnalyticsParams(params) {
  return Object.entries(params || {}).reduce((safe, [key, value]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return safe;
    }

    if (value === undefined || value === null) {
      return safe;
    }

    safe[key] =
      typeof value === "object" && !Array.isArray(value)
        ? sanitizeAnalyticsParams(value)
        : value;
    return safe;
  }, {});
}

function capturePostHogEvent(eventName, eventParams) {
  if (!posthog.__loaded) return;
  posthog.capture(eventName, { ...eventParams, $geoip_disable: true });
}
