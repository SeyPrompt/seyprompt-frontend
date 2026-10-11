import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { POLICY_EFFECTIVE_DATE, SUPPORT_EMAIL } from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Shipping & Digital Delivery Policy",
  description:
    "Read how SeyPrompt delivers digital prompts, credit packs, and all-access plan entitlements after verified payment.",
  path: "/shipping-policy"
});

const sections = [
  {
    title: "No Physical Shipping",
    items: [
      "SeyPrompt sells digital prompt access, credit packs, and account-based all-access plans. No physical goods are shipped.",
      "Because products are digital, there are no courier charges, tracking numbers, or delivery addresses for normal SeyPrompt purchases."
    ]
  },
  {
    title: "How Digital Delivery Works",
    items: [
      "Single-prompt purchases unlock the selected prompt in the purchasing account after Razorpay payment verification succeeds on SeyPrompt's backend.",
      "Credit packs add credits to the account wallet after verified payment and create a credit ledger entry.",
      "All-access plans create a time-limited entitlement for the purchasing account based on the selected plan duration."
    ]
  },
  {
    title: "Activation Timing",
    items: [
      "The current implementation grants access after server-side verification or webhook processing confirms payment. Most verified orders should appear shortly after checkout completes.",
      "If payment is pending, closed before completion, fails verification, or Razorpay/webhook confirmation is delayed, access may not appear until the order can be verified.",
      "SeyPrompt does not grant access based only on a browser success callback; backend verification controls delivery."
    ]
  },
  {
    title: "Access Location",
    items: [
      "Unlocked prompts are available inside your SeyPrompt account and dashboard.",
      "The orders page shows payment history and status where supported by the current account billing implementation.",
      "Purchased content is account-based. Downloadable invoices, receipts, or exports are not currently implemented as a separate self-service feature."
    ]
  },
  {
    title: "Missing Access",
    items: [
      "If you paid successfully but do not see access or credits, contact support with your account email, purchase date, prompt or plan name, and Razorpay order/payment reference if available.",
      "Do not share full card numbers, CVV, OTPs, banking passwords, or account passwords when reporting delivery issues."
    ]
  }
];

export default function ShippingPolicyPage() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-container">
          <div className="legal-hero-copy">
            <div className="eyebrow">SeyPrompt Delivery</div>
            <h1>Shipping & Digital Delivery Policy</h1>
            <p>
              SeyPrompt is a digital prompt service. This page explains how
              prompt unlocks, credits, and all-access plans are delivered.
            </p>
            <span className="legal-updated">Effective: {POLICY_EFFECTIVE_DATE}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
          <div className="panel legal-summary">
            <h2>Digital Only</h2>
            <p>
              No physical item is shipped. If digital access is missing after a
              successful payment, contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
              <Link href="/contact">contact page</Link>.
            </p>
          </div>

          <div className="legal-content">
            {sections.map((section) => (
              <article className="card legal-card" key={section.title}>
                <h2>{section.title}</h2>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
