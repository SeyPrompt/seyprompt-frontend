import { absoluteUrl } from "@/lib/seo";

export const UTM_STORAGE_KEY = "seyprompt_utm";

export const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
];

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getParamsFromSearch(search) {
  const searchParams = new URLSearchParams(search || "");
  const utm = {};

  UTM_PARAMS.forEach((key) => {
    const value = sanitizeValue(searchParams.get(key));

    if (value) {
      utm[key] = value;
    }
  });

  return utm;
}

export function getStoredUTMParams() {
  if (!isBrowser()) {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(UTM_STORAGE_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    return UTM_PARAMS.reduce((utm, key) => {
      const value = sanitizeValue(parsedValue[key]);

      if (value) {
        utm[key] = value;
      }

      return utm;
    }, {});
  } catch (_error) {
    return {};
  }
}

export function captureUTMParams(search) {
  if (!isBrowser()) {
    return null;
  }

  const capturedUTM = getParamsFromSearch(search ?? window.location.search);

  if (!Object.keys(capturedUTM).length) {
    return null;
  }

  window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(capturedUTM));

  if (process.env.NODE_ENV === "development") {
    console.log("[UTM] Captured:", capturedUTM);
  }

  return capturedUTM;
}

export function clearUTMParams() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(UTM_STORAGE_KEY);
}

export function generateUTMUrl(url, params = {}) {
  const targetUrl = new URL(absoluteUrl(url || "/"));

  UTM_PARAMS.forEach((key) => {
    const value = sanitizeValue(params[key]);

    if (value) {
      targetUrl.searchParams.set(key, value);
    }
  });

  return targetUrl.toString();
}
