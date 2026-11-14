export const INDIA_TIME_ZONE = "Asia/Kolkata";

const indiaDateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: INDIA_TIME_ZONE
});

export function formatIndiaDateTime(value, fallback = "-") {
  const date = value == null || value === "" ? null : new Date(value);
  return date && !Number.isNaN(date.getTime()) ? `${indiaDateTime.format(date)} IST` : fallback;
}

export function currencyFractionDigits(currency) {
  return ["JPY", "KRW"].includes(String(currency || "").toUpperCase()) ? 0 : 2;
}

export function formatCurrency(amount, currency = "INR") {
  if (amount == null || !Number.isFinite(Number(amount))) return "Unavailable";
  const code = String(currency || "INR").toUpperCase();
  const digits = currencyFractionDigits(code);
  return new Intl.NumberFormat("en-IN", {
    currency: /^[A-Z]{3}$/.test(code) ? code : "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    style: "currency"
  }).format(Number(amount));
}

export function formatMinorCurrency(amount, currency) {
  return amount == null ? "Unavailable" : formatCurrency(Number(amount) / 10 ** currencyFractionDigits(currency), currency);
}

export function formatOrderAmount(order) {
  const amountMinor = order.priceSnapshot?.amountMinor ?? order.amountMinor;
  const currency = order.priceSnapshot?.currency || order.currency;
  if (amountMinor != null) return formatMinorCurrency(amountMinor, currency);
  if (["direct_prompt", "credit_plan"].includes(order.type)) return formatMinorCurrency(order.amount, currency);
  return formatCurrency(order.amount, currency);
}

export function paymentTypeLabel(type) {
  switch (type) {
    case "direct_prompt":
    case "single_prompt":
      return "Single Prompt";
    case "credit_plan":
      return "Credit Pack";
    case "subscription":
      return "Membership";
    default:
      return "Payment";
  }
}
