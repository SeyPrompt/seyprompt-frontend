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
