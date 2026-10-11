import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { POLICY_EFFECTIVE_DATE, SUPPORT_EMAIL, launchBlockers } from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "Read SeyPrompt's policy for refunds, cancellations, duplicate payments, missing access, credits, and fixed-duration all-access plans.",
  path: "/refund-policy"
});

const sections = [
  {
    title: "Cancellation",
    items: [
      "SeyPrompt's current all-access plans are fixed-duration manual purchases. The code does not implement automatic recurring renewal, so cancellation generally means not purchasing another plan after the current period ends.",
      "Single-prompt unlocks and credit packs are digital purchases delivered to your account after verified payment and do not have a recurring cancellation cycle.",
      "If future automatic renewal is added, cancellation controls and renewal timing must be updated before launch."
    ]
  },
  {
    title: "When To Contact Support",
    items: [
      "Contact support if you were charged twice for the same purchase, paid successfully but did not receive access or credits, were charged the wrong amount, or believe a payment status is incorrect.",
      "Include your SeyPrompt account email, order page details, Razorpay payment or order reference if available, purchase date, and the issue summary.",
      "Never send full card numbers, CVV, OTPs, banking passwords, or account passwords."
    ]
  },
  {
    title: "Refund Review",
    items: [
      "Refund requests are reviewed against order status, payment provider records, delivered access, credit ledger activity, and applicable consumer rights.",
      "Approved refunds are sent through the original payment provider or payment method where supported by Razorpay and the bank/card network.",
      "Refund timing depends on Razorpay and the issuing bank. SeyPrompt can confirm submission, but bank settlement may take additional business days."
    ]
  },
  {
    title: "Digital Access And Credits",
    items: [
      "If a refund is approved for a prompt unlock or all-access plan, related entitlements may be revoked.",
      "If a refund is approved for credits, related credit balance or credit ledger entries may be reversed where technically and operationally possible.",
      "The final policy for used/unlocked digital content, unused credits, promotional credits, and gifts still requires business approval before public release."
    ]
  },
  {
    title: "Duplicate Or Failed Orders",
    items: [
      "Pending, failed, or cancelled orders do not grant access unless server-side verification or webhook processing marks the order paid.",
      "If Razorpay shows a successful payment but SeyPrompt has not delivered access, support can review the payment reference and manually resolve the entitlement or refund path.",
      "Duplicate successful charges for the same intended purchase should be reported for review."
    ]
  }
];

export default function RefundPolicyPage() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-container">
          <div className="legal-hero-copy">
            <div className="eyebrow">SeyPrompt Billing</div>
            <h1>Refund & Cancellation Policy</h1>
            <p>
              This page explains cancellation and refund handling for
              single-prompt unlocks, credit packs, and fixed-duration
              all-access plans.
            </p>
            <span className="legal-updated">Effective: {POLICY_EFFECTIVE_DATE}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
          <div className="panel legal-summary">
            <h2>Need Billing Help?</h2>
            <p>
              Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use
              the <Link href="/contact">contact page</Link>. Include your order
              or payment reference, but never share card numbers, CVV, OTPs, or passwords.
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

            <article className="card legal-card legal-blocker-card">
              <h2>Policy Decisions Still Needed</h2>
              <ul>
                {launchBlockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
