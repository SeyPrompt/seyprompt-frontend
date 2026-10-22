const amountMinor = (row) => Number(row.amountMinor ?? Math.round(Number(row.amount || 0) * 100));

// Compatibility for plans saved before gateway IDs moved into regional rows.
export function regionalGatewayPlanId(plan, row) {
  if (row.razorpayPlanId !== undefined) return String(row.razorpayPlanId || '').trim();
  const prices = (plan.regionalPrices || []).filter((entry) => entry.currency === row.currency);
  if (new Set(prices.map(amountMinor)).size > 1) return '';
  const ids = [...new Set((plan.recurringPlans || []).filter((entry) => entry.currency === row.currency)
    .map((entry) => entry.razorpayPlanId).filter(Boolean))];
  return ids.length === 1 ? ids[0] : '';
}

export function buildRegionalPrices(rows) {
  return rows.map((row) => {
    const razorpayPlanId = String(row.razorpayPlanId || '').trim();
    if (razorpayPlanId && !/^plan_[a-zA-Z0-9]+$/.test(razorpayPlanId)) {
      throw new Error(`Enter a valid Razorpay plan ID for ${row.region}, starting with plan_.`);
    }
    return { region: String(row.region || '').trim().toUpperCase(), currency: row.currency,
      amount: Number(row.amount || 0), isActive: Boolean(row.isActive), razorpayPlanId };
  });
}
