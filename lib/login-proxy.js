import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export function loginProxyHeaders(headers, path, body) {
  // A dedicated key takes precedence; the existing server-only proxy key also
  // supports installations that already configured regional pricing.
  const secret = process.env.LOGIN_METADATA_PROXY_SECRET || process.env.PRICING_PROXY_SECRET;
  // These headers are authoritative only inside Vercel's edge boundary.
  if (process.env.VERCEL !== "1" || !secret) return {};
  const ip = headers.get("x-vercel-forwarded-for");
  let city = headers.get("x-vercel-ip-city");
  try { city = city ? decodeURIComponent(city) : null; } catch { city = null; }
  const context = Buffer.from(JSON.stringify({
    at: Date.now(), ip: isIP(ip || "") ? ip : null,
    country: headers.get("x-vercel-ip-country"),
    state: headers.get("x-vercel-ip-country-region"), city,
  })).toString("base64url");
  return {
    "x-login-context": context,
    "x-login-signature": createHmac("sha256", secret).update(`${path}:${JSON.stringify(body)}:${context}`).digest("hex"),
  };
}
