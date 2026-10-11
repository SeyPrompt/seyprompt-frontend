import Link from "next/link";
import { createPageMetadata, PARENT_COMPANY_URL } from "@/lib/seo";
import {
  LEGAL_OPERATOR_DISPLAY,
  policyDateLabel,
  SUPPORT_EMAIL
} from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Terms & Conditions",
  description:
    "Read SeyPrompt's terms for accounts, free prompts, paid prompt unlocks, credit packs, all-access plans, and AI prompt usage.",
  path: "/terms-of-use"
});

const terms = [
  {
    title: "About SeyPrompt",
    items: [
      `SeyPrompt is a digital prompt service operated by ${LEGAL_OPERATOR_DISPLAY}.`,
      "These terms apply when you browse SeyPrompt, create an account, save prompts, unlock paid prompts, buy credits, purchase an all-access plan, or contact support.",
      "By using SeyPrompt or completing a purchase, you agree to these terms and the related policies linked below."
    ]
  },
  {
    title: "Accounts",
    items: [
      "You are responsible for keeping your account email, password, OTPs, and device access secure.",
      "Use accurate account and contact information so purchases, access, support, and refund requests can be matched to you.",
      "Do not share full card numbers, CVV, banking passwords, OTPs, or account passwords with SeyPrompt support."
    ]
  },
  {
    title: "Free And Paid Features",
    items: [
      "SeyPrompt includes free prompt browsing and paid features such as single-prompt unlocks, credit packs, and fixed-duration all-access plans.",
      "Paid access is delivered to the purchasing SeyPrompt account after payment is confirmed.",
      "Free prompts, paid prompts, sample outputs, categories, and tool labels may change as the library evolves."
    ]
  },
  {
    title: "Single-Prompt Purchases",
    items: [
      "A single-prompt purchase unlocks the specific premium prompt shown at checkout for the purchasing account.",
      "Single-prompt access has no scheduled expiry date, but this is not a lifetime availability guarantee. Content may be removed or restricted for legal, safety, rights, security, service, or policy reasons.",
      "A prompt purchase does not include external AI tool subscriptions, external generation credits, or guaranteed output quality."
    ]
  },
  {
    title: "Credits",
    items: [
      "Credit packs add credits to your SeyPrompt wallet after payment is confirmed.",
      "Credits can be spent only on prompts where credit unlock is enabled and where the displayed credit cost is available.",
      "Credits do not currently have a scheduled expiry date. If that changes, SeyPrompt will provide notice where required before applying a new expiry rule to existing paid credits."
    ]
  },
  {
    title: "All-Access Plans",
    items: [
      "All-access plans grant access to premium prompts during the plan duration shown at checkout.",
      "Plans start when payment is confirmed and end when the purchased duration expires.",
      "Plans do not renew automatically. Buying another plan is a separate manual purchase.",
      "If you already have active all-access, SeyPrompt does not offer another all-access purchase from the account dashboard. If an all-access purchase is completed, the access period starts from that payment confirmation and does not add remaining time from another plan."
    ]
  },
  {
    title: "Pricing, Taxes, And Regions",
    items: [
      "Review the product, plan, currency, discounts, credits, and total payable amount shown at checkout before paying.",
      "SeyPrompt may show different prices, currencies, or product availability by country or region.",
      "The checkout amount shown before payment is the total payable to SeyPrompt for that order. Any applicable taxes charged by SeyPrompt are included in that checkout total unless the checkout shows them separately.",
      "Your bank, card network, wallet, or payment provider may apply separate foreign-exchange, conversion, or payment charges outside SeyPrompt's checkout total."
    ]
  },
  {
    title: "Permitted Use",
    items: [
      "You may use unlocked prompts for personal, educational, creative, and business workflows, including commercial use of your own outputs where permitted by the AI tool and applicable law.",
      "You may adapt prompts for your own workflow, but you may not scrape, mass copy, redistribute, resell, sublicense, or publish SeyPrompt's library as a competing prompt library, database, marketplace, or dataset.",
      "Do not use SeyPrompt to violate laws, intellectual-property rights, privacy rights, platform rules, payment rules, security controls, or third-party terms."
    ]
  },
  {
    title: "Samples, Media, And AI Outputs",
    items: [
      "Prompt text and sample images or videos are provided to help you evaluate and use the prompt. Sample media may include generated, edited, uploaded, or third-party materials and is not a transfer of third-party rights.",
      "SeyPrompt does not promise that you own third-party AI outputs, model outputs, provider assets, or rights controlled by external tools.",
      "You are responsible for reviewing AI outputs before publishing, selling, submitting, or relying on them."
    ]
  },
  {
    title: "Third-Party Tools",
    items: [
      "External AI tools such as ChatGPT, Gemini, Claude, Midjourney, Canva, DALL-E, Kling, Luma, and similar services are operated independently.",
      "External accounts, subscriptions, generation credits, model limits, and provider terms are separate from SeyPrompt unless a specific SeyPrompt offer expressly says otherwise."
    ]
  },
  {
    title: "Cancellations, Refunds, And Failed Payments",
    items: [
      "Because all-access plans are fixed-duration manual purchases, cancellation generally means choosing not to buy another plan after the current access period ends.",
      "Single-prompt unlocks and credit packs are digital purchases and do not have a recurring cancellation cycle.",
      "Pending, failed, or reversed payments do not grant access. If money is deducted but the purchase is not confirmed, contact support so the order can be reviewed.",
      "Refund handling is described in the Refund & Cancellation Policy. Approved refunds may remove the related access or credits for the refunded purchase."
    ]
  },
  {
    title: "Service Changes And Suspension",
    items: [
      "SeyPrompt may update products, prices, plans, credits, prompt availability, features, and policies from time to time.",
      "SeyPrompt may suspend, revoke, or restrict access for fraud, chargebacks, misuse, scraping, resale, abuse, security risks, or violation of these terms.",
      "Nothing in these terms limits mandatory consumer rights that cannot be waived under applicable law."
    ]
  },
  {
    title: "Disputes And Support",
    items: [
      `For account, billing, delivery, refund, privacy, or policy questions, use the contact page or email ${SUPPORT_EMAIL}.`,
      "These terms do not choose a specific court or forum. Mandatory rights and dispute processes under applicable law continue to apply."
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
              prompt unlocks, credit packs, and fixed-duration all-access plans work.
            </p>
            <p>
              SeyPrompt is operated by{" "}
              <a href={PARENT_COMPANY_URL} rel="noopener noreferrer" target="_blank">
                {LEGAL_OPERATOR_DISPLAY}
              </a>
              . Review the checkout details before paying: paid products are
              digital, external AI tools are separate, and all-access plans do
              not renew automatically.
            </p>
            <span className="legal-updated">{policyDateLabel}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
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
          </div>
        </div>
      </section>
    </main>
  );
}
