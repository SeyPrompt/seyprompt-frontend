import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Read how SeyPrompt handles analytics data, contact form messages, cookies, and user privacy.",
  path: "/privacy-policy"
});

const sections = [
  {
    title: "Information We Collect",
    items: [
      "Usage data through Google Analytics, such as pages visited, approximate location, device type, browser, referral source, and interactions with the site.",
      "Contact form details when you choose to message us, including your name, email address, selected topic, message, and any campaign details attached to your visit.",
      "Prompt usage actions, such as copy or open events, may be measured in analytics to understand which prompts are useful."
    ]
  },
  {
    title: "How We Use Information",
    items: [
      "To understand how visitors use SeyPrompt and improve the prompt library, pages, and site experience.",
      "To respond to messages sent through the contact form.",
      "To monitor basic performance, discover popular content, and improve future prompt categories."
    ]
  },
  {
    title: "Cookies and Analytics",
    items: [
      "SeyPrompt uses Google Analytics when analytics is enabled. Google Analytics may use cookies or similar technologies to measure traffic and interactions.",
      "You can control cookies through your browser settings. Blocking cookies may affect analytics tracking but should not stop you from viewing, copying, or sharing prompts.",
      "Campaign parameters such as utm_source or utm_campaign may be stored locally in your browser and attached to a contact form message if you submit one."
    ]
  },
  {
    title: "Sharing of Information",
    items: [
      "We do not sell personal information.",
      "Analytics data may be processed by Google Analytics according to Google's own privacy practices.",
      "Contact form submissions may be processed by the systems used to receive, store, or respond to your message."
    ]
  },
  {
    title: "Your Choices",
    items: [
      "You can avoid sending personal information by not using the contact form.",
      "You can request that we delete a message you sent through the contact form, subject to any reasonable operational or legal need to keep it.",
      "You can use browser settings, privacy tools, or Google's available opt-out tools to limit analytics tracking."
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
              SeyPrompt is a prompt library. You can browse, copy, and share
              prompts without creating an account or making a payment.
            </p>
            <span className="legal-updated">Last updated: May 12, 2026</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
          <div className="panel legal-summary">
            <h2>Short Version</h2>
            <p>
              We use Google Analytics to understand site traffic and a contact
              form so visitors can message us. We do not sell your personal
              information, and we do not require accounts or payments to use the
              prompt library.
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
                <Link href="/contact">contact page</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
