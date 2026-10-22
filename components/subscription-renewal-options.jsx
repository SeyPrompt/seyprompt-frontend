"use client";

import Link from "next/link";

export default function SubscriptionRenewalOptions({ plan, enabled, onChange, disabled = false }) {
  const offer = plan?.autoPay;
  const selected = Boolean(enabled && offer?.eligible);
  const renewalDate = offer?.nextExpectedBillingDate ? new Date(offer.nextExpectedBillingDate) : null;
  return (
    <div className="subscription-renewal-options">
      {offer?.eligible ? (
        <label>
          <input type="checkbox" checked={selected} disabled={disabled}
            onChange={(event) => onChange(event.target.checked)} />
          <span>Enable AutoPay <small>— renew automatically every {offer.interval} days</small></span>
        </label>
      ) : <strong>One-time payment</strong>}
      <p aria-live="polite">
        {selected ? <>
          Pay {plan.pricing?.displayPrice} {offer.currency} every {offer.interval} days using your authorized card.
          {renewalDate && !Number.isNaN(renewalDate.getTime()) ? <> Next expected renewal: {renewalDate.toLocaleDateString("en-IN")}.</> : null}
          {" "}Authorize AutoPay securely in Razorpay. Cancel future renewals from your dashboard; paid access continues until its end date.
        </> : <>
          Pay {plan?.pricing?.displayPrice} {plan?.pricing?.currency} once for {plan?.durationDays} days of all-access.
          {" "}No automatic charges. Renew whenever you choose.
        </>}
      </p>
      <p><Link href="/terms-of-use">Subscription terms</Link>{" · "}
        <Link href="/refund-policy">Cancellation terms</Link></p>
    </div>
  );
}
