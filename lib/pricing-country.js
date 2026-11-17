import { createHmac } from "node:crypto";
import { renderVisitor } from "./render-geo.js";

export function pricingCountryHeaders(headers) {
  const country = renderVisitor(headers)?.country ||
    (process.env.NODE_ENV === "development" ? process.env.DEV_PRICING_COUNTRY : "");
  const value = country?.trim().toUpperCase();
  if (!value || !/^[A-Z]{2}$/.test(value) || value === "XX") return {};

  const secret = process.env.PRICING_PROXY_SECRET;
  if (!secret) return process.env.NODE_ENV === "production" ? {} : { "x-pricing-country": value };

  const timestamp = String(Math.floor(Date.now() / 1000));
  return {
    "x-pricing-country": value,
    "x-pricing-timestamp": timestamp,
    "x-pricing-signature": createHmac("sha256", secret).update(`${value}:${timestamp}`).digest("hex"),
  };
}
