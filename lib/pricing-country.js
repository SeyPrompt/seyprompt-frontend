const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code"
];

export function pricingCountryHeaders(headers) {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim().toUpperCase();

    // Cloudflare uses XX/T1 when the country is unknown or anonymized.
    if (/^[A-Z]{2}$/.test(value || "") && value !== "XX") {
      // Forward one consistent country across the backend's supported headers.
      // Never forward the full incoming header set (cookies, host, etc.).
      return { "x-vercel-ip-country": value, "cf-ipcountry": value, "x-country-code": value };
    }
  }

  return {};
}
