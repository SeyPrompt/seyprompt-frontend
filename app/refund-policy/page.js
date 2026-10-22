import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { policyDateLabel, SUPPORT_EMAIL } from "@/lib/policy-info";

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
      "SeyPrompt all-access plans do not renew automatically by default. Optional AutoPay requires explicit authorization. Cancel AutoPay from your account to stop future charges; cancellation status is confirmed by Razorpay and existing paid access remains until expiry. Cancellation does not itself refund a completed payment.",
      "Single-prompt unlocks and credit packs are digital purchases delivered to your account after payment confirmation and do not have a recurring cancellation cycle.",
      "A failed-payment reversal or bank chargeback is different from choosing not to renew and may be handled by your bank, card network, wallet, Razorpay, or SeyPrompt depending on the issue."
    ]
  },
  {
    title: "When To Contact Support",
    items: [
      "Contact support if you were charged twice for the same intended purchase, paid successfully but did not receive access or credits, were charged the wrong amount, or believe a payment status is incorrect.",
      "Include your SeyPrompt account email, purchase date, product or plan name, order page details, Razorpay order or payment reference if available, and a short explanation of the issue.",
      "Never send full card numbers, CVV, OTPs, banking passwords, or account passwords."
    ]
  },
  {
    title: "Refund Eligibility",
    items: [
      "Duplicate successful charges, incorrect charges, successful payments without delivered access, and materially defective or misdescribed digital products are eligible for review and an appropriate remedy.",
      "Single-prompt unlocks, used credits, partially used credit packs, active or used all-access plans, promotional credits, and gifts are digital items and are not automatically refundable for change-of-mind requests after access is delivered.",
      "Unused purchased credits and unused all-access plans can be reviewed when you contact support before using the credits or plan access.",
      "Promotional credits and gifts have no cash value and are not refundable unless required by law or stated in a specific offer.",
      "Nothing in this policy limits mandatory consumer remedies that apply by law."
    ]
  },
  {
    title: "Remedies",
    items: [
      "If access or credits were not delivered after a successful payment, SeyPrompt may restore the purchased access or credits, or approve a refund if delivery cannot be resolved.",
      "For a duplicate or incorrect charge, SeyPrompt may refund the duplicate or incorrect amount after matching the account, order, amount, and payment references.",
      "For a defective or materially misdescribed digital product, SeyPrompt may provide corrected access, replacement access, credit restoration, or a refund depending on the issue and applicable consumer rights.",
      "A refund of one purchase does not automatically revoke unrelated paid purchases."
    ]
  },
  {
    title: "Review And Refund Timing",
    items: [
      "SeyPrompt aims to acknowledge billing and refund requests within 48 hours after receiving enough information to identify the order.",
      "Refund reviews are handled as quickly as reasonably possible after the required order and payment details are available.",
      "If a refund is approved, SeyPrompt aims to initiate it through Razorpay within 7 business days, where supported for the original payment.",
      "Razorpay customer guidance says refunds or failed-order credits generally reflect in the bank account within 5-7 business days after initiation or order failure, subject to payment method and bank processing.",
      "SeyPrompt can confirm that a refund has been initiated, but final bank settlement timing is controlled by Razorpay, banks, wallets, card networks, and payment rails."
    ]
  },
  {
    title: "Effect Of Approved Refunds",
    items: [
      "If a refund is approved for a single-prompt unlock or all-access plan, the related access may be removed for the refunded purchase.",
      "If a refund is approved for credits, SeyPrompt may reverse the related credit balance or credit activity for the refunded purchase where possible.",
      "If a payment is reversed by a bank, card network, wallet, or Razorpay, related access or credits may be removed for that purchase."
    ]
  },
  {
    title: "Missing Access",
    items: [
      "If payment appears successful but access or credits are missing, contact support before making a duplicate purchase where possible.",
      "Support may resolve missing access by confirming the purchase, restoring the related access or credits, or reviewing whether a refund path applies.",
      "Pending, failed, cancelled, or reversed payments do not grant access unless the payment is later confirmed."
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
              all-access plans. For billing help, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
              <Link href="/contact">contact page</Link> with your order or
              payment reference.
            </p>
            <span className="legal-updated">{policyDateLabel}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
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
