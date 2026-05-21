"use client";

const DEDUPE_WINDOW_MS = 300;
let lastEventKey = "";
let lastEventTime = 0;

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

  const eventParams = {
    site_name: "SeyPrompt",
    ...params
  };
  const eventKey = `${eventName}:${stableSerialize(eventParams)}`;
  const now = Date.now();

  if (eventKey === lastEventKey && now - lastEventTime < DEDUPE_WINDOW_MS) {
    return;
  }

  lastEventKey = eventKey;
  lastEventTime = now;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventParams
  });
}

export function setAnalyticsUserIdFromHash(hashedId) {
  if (typeof window === "undefined" || !hashedId) return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_id: hashedId });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ user_id: hashedId });
}

export function clearAnalyticsUserId() {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_id: null });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ user_id: null });
}

export function setAnalyticsUserProperty(hashedId) {
  if (typeof window === "undefined" || !hashedId) return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_properties: { hashed_user_id: hashedId } });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ hashed_user_id: hashedId });
}

export function clearAnalyticsUserProperty() {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("set", { user_properties: { hashed_user_id: null } });
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ hashed_user_id: null });
}
