import { createHmac } from "node:crypto";
const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code"
];

export function pricingCountryHeaders(headers) {
  const candidates = process.env.NODE_ENV === "production"
    ? [headers.get("x-vercel-ip-country")]
    : COUNTRY_HEADERS.map((name) => headers.get(name));
  // localhost does not receive edge geolocation. Allow an explicit development
  // country without changing the production fallback for unknown visitors.
  if (process.env.NODE_ENV === "development") {
    candidates.push(process.env.DEV_PRICING_COUNTRY);
  }

  for (const candidate of candidates) {
    const value = candidate?.trim().toUpperCase();

    // Cloudflare uses XX/T1 when the country is unknown or anonymized.
    if (/^[A-Z]{2}$/.test(value || "") && value !== "XX") {
      // Forward one consistent country across the backend's supported headers.
      // Never forward the full incoming header set (cookies, host, etc.).
      const timestamp = String(Math.floor(Date.now() / 1000));
      const secret = process.env.PRICING_PROXY_SECRET;
      return {
        "x-vercel-ip-country": value,
        ...(secret ? {
          "x-pricing-timestamp": timestamp,
          "x-pricing-signature": createHmac("sha256", secret).update(`${value}:${timestamp}`).digest("hex")
        } : {})
      };
    }
  }

  return {};
}
