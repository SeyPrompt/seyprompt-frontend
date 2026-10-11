import Link from "next/link";
import { createPageMetadata, PARENT_COMPANY_NAME, PARENT_COMPANY_URL } from "@/lib/seo";
import { POLICY_EFFECTIVE_DATE, launchBlockers } from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Terms & Conditions",
  description:
    "Read SeyPrompt's terms for accounts, free prompts, paid prompt unlocks, credit packs, all-access plans, and AI prompt usage.",
  path: "/terms-of-use"
});

const terms = [
  {
    title: "Free And Paid Features",
    items: [
      "SeyPrompt includes free prompt browsing and paid features such as single-prompt unlocks, credit packs, and time-limited all-access plans.",
      "Paid access is delivered through your SeyPrompt account after payment verification succeeds on the backend.",
      "Free prompts and paid prompts may change, be reorganized, or be removed as the library evolves."
    ]
  },
  {
    title: "Single-Prompt Purchases",
    items: [
      "A single-prompt purchase unlocks the specific premium prompt shown at checkout for the purchasing account.",
      "Current direct prompt purchases create prompt-specific access without an expiry date unless the access is refunded, revoked for misuse, or otherwise required by law.",
      "A prompt purchase does not include external AI tool subscriptions, generation credits, or guaranteed output quality."
    ]
  },
  {
    title: "Credit Packs",
    items: [
      "Credit packs add credits to your SeyPrompt wallet after successful server-verified payment.",
      "Credits can be spent only on prompts where credit unlock is enabled and the displayed credit cost is available.",
      "The current implementation records credit purchases and spending in a ledger. No automatic credit expiry or rollover rule is configured in code, so no new expiry rule should be applied retroactively without notice and migration handling."
    ]
  },
  {
    title: "All-Access Plans",
    items: [
      "All-access plans grant access to premium prompts during the plan duration shown at checkout, such as 30 days, 90 days, or 1 year depending on the plan.",
      "The current checkout creates one Razorpay order for the selected plan and grants an entitlement with an expiry date. The code does not implement automatic recurring renewal.",
      "If a plan expires, prompt access may require a new plan purchase or separate prompt unlock."
    ]
  },
  {
    title: "Pricing, Currency, Taxes, And Regions",
    items: [
      "Prices, currencies, regional availability, discounts, credits, and entitlements are calculated on the backend and may differ by detected country or configured pricing region.",
      "The checkout amount shown by Razorpay is the payable amount for that order. Taxes, gateway charges, or currency conversion charges may depend on the payment provider, bank, card network, or applicable law.",
      "Client-side prices are informational only and do not override backend pricing."
    ]
  },
  {
    title: "Permitted Use And Restrictions",
    items: [
      "You may use unlocked prompts for personal, educational, creative, and business workflows, including commercial use of your own AI outputs where allowed by the AI tool you use.",
      "You may not scrape, mass copy, redistribute, resell, sublicense, or publish SeyPrompt's library as a competing prompt library or dataset.",
      "Do not use SeyPrompt to violate laws, intellectual-property rights, privacy rights, platform policies, payment rules, or security controls."
    ]
  },
  {
    title: "AI Outputs And Third-Party Tools",
    items: [
      "AI results vary by model, settings, uploaded inputs, and provider behavior. SeyPrompt does not guarantee accuracy, suitability, revenue, rankings, or any specific output.",
      "Third-party tools such as ChatGPT, Gemini, Claude, Midjourney, Canva, DALL-E, Kling, Luma, and others are operated independently and may require their own accounts, payments, subscriptions, credits, and terms.",
      "You are responsible for reviewing outputs before publishing, selling, submitting, or relying on them."
    ]
  },
  {
    title: "Cancellation, Failed Payments, And Refunds",
    items: [
      "Because current all-access plans are fixed-duration manual purchases, cancellation generally means choosing not to buy another plan after the current access period ends.",
      "Failed or pending payments do not grant access unless server verification or webhook processing confirms the payment.",
      "Refund handling is described in the Refund & Cancellation Policy. Approved refunds may revoke related prompt access, subscription access, or credits."
    ]
  },
  {
    title: "Accounts, Security, And Suspension",
    items: [
      "You are responsible for keeping your account email, password, OTPs, and device access secure.",
      "SeyPrompt may suspend, revoke, or restrict access for fraud, chargebacks, abuse, scraping, resale, security risks, or violation of these terms.",
      "Never share full card numbers, CVV, banking passwords, OTPs, or account passwords with SeyPrompt support."
    ]
  },
  {
    title: "Policy Changes And Consumer Rights",
    items: [
      "SeyPrompt may update prices, plans, credit packs, prompt access rules, and policies. Material changes should be communicated where legally required.",
      "Nothing in these terms limits mandatory consumer rights that cannot be waived under applicable law.",
      "Questions can be sent through the contact page."
    ]
  }
];

export default function TermsOfUsePage() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-container">
          <div className="legal-hero-copy">
            <div className="eyebrow">SeyPrompt Terms</div>
            <h1>Terms & Conditions</h1>
            <p>
              These terms explain how SeyPrompt accounts, free prompts, premium
              prompt unlocks, credit packs, and all-access plans work.
            </p>
            <p>
              SeyPrompt is a product of{" "}
              <a href={PARENT_COMPANY_URL} rel="noopener noreferrer" target="_blank">
                {PARENT_COMPANY_NAME}
              </a>
              .
            </p>
            <span className="legal-updated">Effective: {POLICY_EFFECTIVE_DATE}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
          <div className="panel legal-summary">
            <h2>Simple Summary</h2>
            <p>
              Buy only if the checkout details match what you want: single
              prompt, credits, or fixed-duration all-access. External AI tools
              are separate, and backend-verified payment controls access.
            </p>
          </div>

          <div className="legal-content">
            {terms.map((term) => (
              <article className="card legal-card" key={term.title}>
                <h2>{term.title}</h2>
                <ul>
                  {term.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}

            <article className="card legal-card">
              <h2>Related Policies</h2>
              <p>
                Review the <Link href="/privacy-policy">Privacy Policy</Link>,{" "}
                <Link href="/refund-policy">Refund & Cancellation Policy</Link>, and{" "}
                <Link href="/shipping-policy">Shipping & Digital Delivery Policy</Link>.
              </p>
            </article>

            <article className="card legal-card legal-blocker-card">
              <h2>Launch Blockers To Confirm</h2>
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
