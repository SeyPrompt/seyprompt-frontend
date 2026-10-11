import Link from "next/link";
import { createPageMetadata, PARENT_COMPANY_NAME, PARENT_COMPANY_URL } from "@/lib/seo";
import {
  POLICY_EFFECTIVE_DATE,
  SUPPORT_EMAIL,
  launchBlockers
} from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Read how SeyPrompt handles account, billing, analytics, prompt, and support data.",
  path: "/privacy-policy"
});

const sections = [
  {
    title: "Account And Profile Data",
    items: [
      "When you create an account, SeyPrompt collects details such as your name, email address, authentication status, saved prompts, unlocked prompts, and account activity needed to run the service.",
      "Passwords are processed through the authentication system and are not shown to SeyPrompt support. Never send passwords, OTPs, full card numbers, CVV, or banking credentials through the contact form.",
      "If you contact support, we collect the information you submit, including name, email address, message topic, message content, and any related order or payment reference you provide."
    ]
  },
  {
    title: "Billing And Purchase Data",
    items: [
      "SeyPrompt records payment orders, product snapshots, pricing region, currency, amount, Razorpay order/payment references, purchase history, subscription entitlements, credit purchases, credit spending, refunds, and related status changes.",
      "Payments are processed through Razorpay. SeyPrompt does not store full card numbers or CVV in its database; Razorpay receives and processes payment credentials under its own terms and privacy practices.",
      "We retain purchase and refund records where needed for account access, support, fraud prevention, tax, audit, and legal obligations."
    ]
  },
  {
    title: "Prompts, Images, And AI Tool Data",
    items: [
      "SeyPrompt stores prompt library content, sample outputs, thumbnails, categories, tools, pricing settings, and admin-managed prompt metadata.",
      "If you upload or provide prompt-related images or text through an available feature, that content may be stored or processed so the feature can work.",
      "SeyPrompt links to third-party AI tools, but using a prompt inside those tools is your action. Data you paste into ChatGPT, Gemini, Midjourney, Claude, Canva, or similar services is handled by that provider."
    ]
  },
  {
    title: "Analytics, Cookies, Logs, And Location",
    items: [
      "SeyPrompt may use analytics, cookies, local storage, server logs, device/browser details, page interactions, referral data, and approximate country or region signals.",
      "Approximate location headers may be used to choose regional pricing and currency availability. Final prices remain calculated by the backend.",
      "You can control cookies through your browser settings. Blocking cookies may affect analytics or sign-in/session convenience."
    ]
  },
  {
    title: "How We Use Data",
    items: [
      "To create and secure accounts, verify payments, deliver prompt access, manage credits, process refunds, provide support, and prevent misuse.",
      "To improve the prompt library, search, categories, visual feed, performance, pricing availability, and product experience.",
      "To comply with applicable accounting, tax, legal, fraud-prevention, and dispute-resolution obligations."
    ]
  },
  {
    title: "Service Providers And Sharing",
    items: [
      "We do not sell personal information.",
      "Data may be processed by service providers that help operate SeyPrompt, including hosting, database, email/contact, analytics, Cloudinary image storage or delivery where configured, and Razorpay payment processing.",
      "We may share information when required by law, to protect SeyPrompt, or to investigate misuse, fraud, chargebacks, security issues, or policy violations."
    ]
  },
  {
    title: "Retention, Deletion, And Requests",
    items: [
      "You may request access, correction, deletion, or account support through the contact page or by emailing support.",
      "Some records, including paid orders, refund records, credit ledgers, and security logs, may be retained for legitimate business, legal, tax, audit, or dispute-resolution needs even after an account request.",
      "SeyPrompt may delete or anonymize inactive operational data when it is no longer needed."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-container">
          <div className="legal-hero-copy">
            <div className="eyebrow">SeyPrompt Privacy</div>
            <h1>Privacy Policy</h1>
            <p>
              SeyPrompt supports accounts, saved prompts, paid prompt unlocks,
              credit packs, all-access plans, analytics, and support workflows.
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
            <h2>Short Version</h2>
            <p>
              SeyPrompt uses account, billing, prompt, analytics, and support
              data to operate the service. Payments are handled by Razorpay, and
              full card numbers/CVV are not stored in SeyPrompt's application
              database based on the current implementation.
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

            <article className="card legal-card">
              <h2>Third-Party Links</h2>
              <p>
                SeyPrompt may link to AI tools, resources, or other websites.
                We are not responsible for the privacy practices or content of
                third-party sites.
              </p>
            </article>

            <article className="card legal-card">
              <h2>Contact</h2>
              <p>
                For privacy questions or requests, please use the{" "}
                <Link href="/contact">contact page</Link> or email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. SeyPrompt is a product
                of{" "}
                <a href={PARENT_COMPANY_URL} rel="noopener noreferrer" target="_blank">
                  {PARENT_COMPANY_NAME}
                </a>
                .
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
