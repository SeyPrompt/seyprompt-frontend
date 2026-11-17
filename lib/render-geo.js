import { isIP } from "node:net";
import geoip from "geoip-lite";

export function renderVisitor(headers) {
  if (process.env.RENDER !== "true") return null;
  // Render's public ingress replaces CF-Connecting-IP with the visitor IP.
  const ip = headers.get("cf-connecting-ip")?.trim();
  if (!ip || !isIP(ip)) return null;

  const location = geoip.lookup(ip);
  return {
    ip,
    country: location?.country || null,
    state: location?.region || null,
    city: location?.city || null,
  };
}
