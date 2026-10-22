"use client";

const REFERRAL_KEY = "seyprompt_first_referral_v1";
// Tab-session attribution avoids a persistent cross-visit tracking identifier.
// Paths, URL queries, fragments, raw user agent and screen dimensions are omitted.
export function captureFirstReferral() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(REFERRAL_KEY);
    if (stored) return JSON.parse(stored);
    const referral = {};
    try {
      const url = new URL(document.referrer);
      if (url.origin !== window.location.origin) referral.source = url.origin;
    } catch { /* Direct navigation has no referrer. */ }
    const params = new URLSearchParams(window.location.search);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9_. -]{1,80}$/.test(value)) referral[key] = value;
    }
    window.sessionStorage.setItem(REFERRAL_KEY, JSON.stringify(referral));
    return referral;
  } catch { return null; }
}

export function collectLoginMetadata() {
  if (typeof window === "undefined") return {};
  let timezone = null;
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Optional. */ }
  return { language: navigator.language || null, timezone, referral: captureFirstReferral() };
}
