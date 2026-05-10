"use client";

export function trackEvent(action, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", action, {
    site_name: "SeyPrompt",
    ...params
  });
}
