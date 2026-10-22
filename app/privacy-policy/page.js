import Link from "next/link";
import { createPageMetadata, PARENT_COMPANY_URL } from "@/lib/seo";
import {
  CUSTOMER_CARE_EMAIL,
  GRIEVANCE_OFFICER,
  LEGAL_OPERATOR_DISPLAY,
  policyDateLabel,
  SUPPORT_EMAIL
} from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Read how SeyPrompt handles account, billing, analytics, prompt, and support data.",
  path: "/privacy-policy"
});

const sections = [
  {
    title: "Who Operates SeyPrompt",
    items: [
      `SeyPrompt is operated by ${LEGAL_OPERATOR_DISPLAY}.`,
      `For privacy, account, payment, or support requests, email ${SUPPORT_EMAIL} or use the contact page.`
    ]
  },
  {
    title: "Information We Collect",
    items: [
      "Account details such as your name, email address, authentication status, saved prompts, unlocked prompts, and account activity.",
      "Order and access records such as purchased prompts, credit packs, all-access plans, prices, currency, discounts, payment references, refund status, credit balances, and access history.",
      "Support submissions, including the name, email address, topic, message, and order or payment reference you choose to provide.",
      "Device and usage data such as browser type, device information, IP address, approximate region, referral details, pages viewed, searches, clicks, and performance or error data.",
      "Prompt library content, sample images or videos, thumbnails, categories, and product metadata shown in the service."
    ]
  },
  {
    title: "Sign-in Security And Location",
    items: [
      "When you successfully sign in using email/password or Google, we record the time, method, login count, coarse device type, operating system, browser family, browser language and timezone. Google may provide your profile picture and verified email status.",
      "We use our hosting provider’s existing IP geolocation to obtain an approximate country, state/region and city when available. This may identify a VPN, proxy or network provider’s location rather than yours; we do not infer whether you use a VPN.",
      "IP addresses expire after seven days and are removed by automatic database cleanup. Expired IPs are hidden immediately; physical deletion may briefly lag. Sign-in history is limited to the latest 50 events within 90 days, with expired events removed by hourly cleanup. Login totals and first referral/campaign labels remain with your account until deletion. Historical login counts before tracking began are unknown.",
      "First referral attribution uses only the external referring domain and available UTM campaign labels from the first visit observed in your tab session. We do not store full referral URLs, raw user agents, screen resolution, or browser fingerprints. Do not put personal information in campaign tags.",
      "SeyPrompt does not request GPS permission or collect or store precise coordinates. Ordinary sign-in, purchases and browsing do not require location permission. There is currently no precise-location record or permission to withdraw in SeyPrompt.",
      "Sign-in metadata is restricted to authorized administrators for account support and security. It is not included in public profile responses or intentionally sent to PostHog or Sentry. You can request deletion of stored sign-in metadata through support; account deletion also erases these metadata records."
    ]
  },
  {
    title: "Payments",
    items: [
      "Payments are processed by Razorpay. SeyPrompt stores order and payment references needed to confirm purchases, deliver access, support refunds, prevent misuse, and maintain business records.",
      "SeyPrompt does not ask you to send full card numbers, CVV, banking passwords, OTPs, or account passwords through support channels.",
      "Razorpay handles payment credentials under its own terms and privacy practices."
    ]
  },
  {
    title: "Cookies, Sessions, And Analytics",
    items: [
      "Essential session storage keeps account, sign-in, saved prompt, cart, checkout, and security features working.",
      "Optional analytics may run through Google Analytics, PostHog, Vercel Analytics, Vercel Speed Insights, and Sentry when the relevant site configuration is enabled.",
      "PostHog is configured with automatic capture and session recording disabled. Product events are sent with sensitive fields removed before capture.",
      "You can limit some cookies and tracking through browser settings or device controls. Browser controls are separate from a site-level consent preference."
    ]
  },
  {
    title: "How We Use Information",
    items: [
      "To create and secure accounts, verify purchases, deliver prompt access, manage credits and plans, process refunds, and respond to support requests.",
      "To show regional pricing and currency availability, improve search and browsing, maintain product quality, troubleshoot errors, and measure performance.",
      "To prevent fraud, misuse, scraping, chargebacks, security incidents, and violations of SeyPrompt policies.",
      "To meet accounting, tax, audit, legal, regulatory, and dispute-resolution obligations."
    ]
  },
  {
    title: "Service Providers",
    items: [
      "We do not sell personal information.",
      "Information may be processed by providers that help run SeyPrompt, including hosting, database, email/contact delivery, authentication, analytics, error monitoring, Cloudinary media storage or delivery, and Razorpay payment processing.",
      "We may disclose information when required by law, to protect users or SeyPrompt, or to investigate misuse, fraud, payment disputes, security issues, or policy violations."
    ]
  },
  {
    title: "Third-Party AI Tools",
    items: [
      "SeyPrompt provides prompts and examples for use with third-party AI tools. External tools such as ChatGPT, Gemini, Claude, Midjourney, Canva, and similar services are operated independently.",
      "Information you paste, upload, or generate inside those external tools is handled by the provider of that tool, not by this Privacy Policy."
    ]
  },
  {
    title: "Retention And Deletion",
    items: [
      "Account and support records are kept while needed to operate the service, respond to requests, and maintain security.",
      "Purchase, refund, credit, tax, accounting, audit, fraud-prevention, and dispute records may be retained where required or reasonably needed, even after an account deletion request.",
      "When information is no longer needed, SeyPrompt may delete, de-identify, or aggregate it."
    ]
  },
  {
    title: "Your Choices And Requests",
    items: [
      "You may request access, correction, deletion, or account support through the contact page or by emailing support.",
      "We may need to verify your identity before acting on a privacy or account request.",
      "Some requests may be limited where retention is required for legal, tax, accounting, fraud-prevention, security, or dispute-resolution reasons."
    ]
  },
  {
    title: "Security And International Processing",
    items: [
      "SeyPrompt uses practical administrative, technical, and access-control measures to protect account, purchase, and support information.",
      "No internet service can guarantee perfect security. Keep your account email, password, OTPs, and devices secure.",
      "SeyPrompt and its providers may process information in India or other countries where service providers operate."
    ]
  },
  {
    title: "Grievances And Escalation",
    items: [
      `For privacy complaints or grievances, contact ${CUSTOMER_CARE_EMAIL}. We aim to acknowledge grievances within 48 hours and redress them within one month, subject to receiving the information needed to review the issue.`,
      GRIEVANCE_OFFICER.name
        ? `Grievance Officer: ${GRIEVANCE_OFFICER.name}, ${GRIEVANCE_OFFICER.designation || "Grievance Officer"}, ${GRIEVANCE_OFFICER.email}.`
        : `Requests sent to ${CUSTOMER_CARE_EMAIL} will be routed for review.`
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
              This policy explains how SeyPrompt collects, uses, shares, and
              protects information when you browse, create an account, save or
              unlock prompts, buy credits or plans, make payments, or contact us.
            </p>
            <p>
              SeyPrompt is operated by{" "}
              <a href={PARENT_COMPANY_URL} rel="noopener noreferrer" target="_blank">
                {LEGAL_OPERATOR_DISPLAY}
              </a>
              . We use account, purchase, access, support, analytics, and
              security information to run the digital prompt service.
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
                For privacy questions or requests, please use the{" "}
                <Link href="/contact">contact page</Link> or email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
