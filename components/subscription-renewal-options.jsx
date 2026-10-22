"use client";

import Link from "next/link";

export default function SubscriptionRenewalOptions({ plan, enabled, onChange, disabled = false }) {
  const offer = plan?.autoPay;
  const selected = enabled && offer?.eligible;
  return (
    <div className="subscription-renewal-options">
      <label>
        <input type="checkbox" checked={Boolean(selected)} disabled={disabled || !offer?.eligible}
          onChange={(event) => onChange(event.target.checked)} />{" "}
        Enable AutoPay — Renew my subscription automatically.
      </label>
      {selected ? (
        <p>{plan.pricing?.displayPrice} ({offer.currency}), every {offer.interval} days.
          Next expected renewal: {new Date(offer.nextExpectedBillingDate).toLocaleDateString("en-IN")}.
          Authorize recurring card payments in Razorpay. You can cancel future renewals from your account.</p>
      ) : (
        <p>One-time payment. Your plan will not renew automatically.
          {!offer?.eligible ? ` ${offer?.reason || "AutoPay is unavailable for this plan."}` : ""}</p>
      )}
      <p>Duration: {plan?.durationDays} days. Price: {plan?.pricing?.displayPrice} {plan?.pricing?.currency}.
        {" "}<Link href="/terms-of-use">Subscription terms</Link>{" · "}
        <Link href="/refund-policy">Cancellation terms</Link></p>
    </div>
  );
}
