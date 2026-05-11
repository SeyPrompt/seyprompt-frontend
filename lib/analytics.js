"use client";

export function trackEvent(action, params = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const eventParams = {
    site_name: "SeyPrompt",
    ...params
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", action, eventParams);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: action,
    ...eventParams
  });
}
