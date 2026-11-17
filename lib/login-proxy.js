import { createHmac } from "node:crypto";
import { renderVisitor } from "./render-geo.js";

export function loginProxyHeaders(headers, path, body) {
  // A dedicated key takes precedence; the existing server-only proxy key also
  // supports installations that already configured regional pricing.
  const secret = process.env.LOGIN_METADATA_PROXY_SECRET || process.env.PRICING_PROXY_SECRET;
  if (!secret) return {};
  const visitor = renderVisitor(headers);
  if (!visitor) return {};
  const context = Buffer.from(JSON.stringify({ at: Date.now(), ...visitor })).toString("base64url");
  return {
    "x-login-context": context,
    "x-login-signature": createHmac("sha256", secret).update(`${path}:${JSON.stringify(body)}:${context}`).digest("hex"),
  };
}
