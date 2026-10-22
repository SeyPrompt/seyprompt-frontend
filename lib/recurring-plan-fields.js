// Supported recurring currencies; prices and gateway IDs remain database-managed.
export const RECURRING_PLAN_CURRENCIES = ["INR", "USD"];

export function buildRecurringPlans(formData) {
  return RECURRING_PLAN_CURRENCIES.flatMap((currency) => {
    const razorpayPlanId = String(formData.get(`recurringPlan_${currency}`) || "").trim();
    if (!razorpayPlanId) return [];
    if (!/^plan_[a-zA-Z0-9]+$/.test(razorpayPlanId)) {
      throw new Error(`Enter a valid Razorpay plan ID for ${currency}, starting with plan_.`);
    }
    return [{ currency, razorpayPlanId }];
  });
}
