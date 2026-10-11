import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { policyDateLabel, SUPPORT_EMAIL } from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Shipping & Digital Delivery Policy",
  description:
    "Read how SeyPrompt delivers digital prompts, credit packs, and all-access plan entitlements after confirmed payment.",
  path: "/shipping-policy"
});

const sections = [
  {
    title: "No Physical Shipping",
    items: [
      "SeyPrompt sells digital prompt access, credit packs, and account-based all-access plans. No physical goods are shipped.",
      "There are no courier fees, tracking numbers, or delivery addresses for normal SeyPrompt purchases."
    ]
  },
  {
    title: "How Digital Delivery Works",
    items: [
      "Single-prompt purchases unlock the selected prompt in the purchasing account after payment is confirmed.",
      "Credit packs add credits to the purchasing account wallet after payment is confirmed.",
      "All-access plans add time-limited premium prompt access to the purchasing account for the selected plan duration."
    ]
  },
  {
    title: "Activation Timing",
    items: [
      "Most confirmed purchases should appear in your account shortly after checkout is completed.",
      "Pending payments, incomplete checkout, failed verification, payment-provider delay, or bank/payment reversals may delay or prevent activation.",
      "If access or credits are not visible after a successful payment, contact support with your account and payment details so the order can be reviewed."
    ]
  },
  {
    title: "Where To Find Purchases",
    items: [
      "Unlocked prompts are available from the prompt page, dashboard, unlocked prompts area, and account experience where shown.",
      "Credits and all-access plan status are shown in the account dashboard where available.",
      "Order history and payment status are shown on the orders page for signed-in users where available."
    ]
  },
  {
    title: "Receipts And Records",
    items: [
      "Payment references and order status are available through your SeyPrompt account where supported and through Razorpay payment communications where applicable.",
      "If you need help with a receipt, invoice, order status, or payment reference, contact support with your account email and purchase details.",
      "Do not send full card numbers, CVV, OTPs, banking passwords, or account passwords when requesting delivery or receipt support."
    ]
  },
  {
    title: "Missing Access",
    items: [
      "If you paid successfully but do not see access or credits, email support or use the contact page.",
      "Include your SeyPrompt account email, purchase date, prompt or plan name, and Razorpay order or payment reference if available.",
      "Support may confirm the purchase, restore the related access or credits, or review whether the Refund & Cancellation Policy applies."
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
              SeyPrompt is a digital prompt service. No physical item is
              shipped. This page explains how prompt unlocks, credits, and
              all-access plans are delivered, and what to do if digital access
              is missing after a successful payment.
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

            <article className="card legal-card">
              <h2>Contact</h2>
              <p>
                If digital access is missing after a successful payment, contact{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
                <Link href="/contact">contact page</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
