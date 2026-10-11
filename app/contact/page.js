import { ContactForm } from "@/components/contact-form";
import { SocialLinks } from "@/components/SocialLinks";
import { WandSparkles, Sparkles, Workflow, Bot, CreditCard, ShieldCheck } from "lucide-react";
import { createPageMetadata, PARENT_COMPANY_URL } from "@/lib/seo";
import {
  CUSTOMER_CARE_EMAIL,
  GRIEVANCE_OFFICER,
  LEGAL_OPERATOR_DISPLAY,
  SUPPORT_EMAIL,
  VERIFIED_BUSINESS_ADDRESS
} from "@/lib/policy-info";

export const metadata = createPageMetadata({
  title: "Contact SeyPrompt - Custom AI Prompts & Support",
  description:
    "Need custom AI prompts or AI solutions? Contact SeyPrompt for personalized help.",
  path: "/contact"
});

const services = [
  {
    icon: WandSparkles,
    title: "Custom AI Prompts",
    description:
      "Get tailored prompts for your audience, workflow, tone, tools, and business goals.",
  },
  {
    icon: Sparkles,
    title: "Prompt Optimization",
    description:
      "Improve existing prompts so they produce clearer, more reliable, and more useful outputs.",
  },
  {
    icon: Workflow,
    title: "AI Workflow Setup",
    description:
      "Design practical AI workflows for content, research, operations, customer support, and teams.",
  },
  {
    icon: Bot,
    title: "Business Automation",
    description:
      "Turn repeatable tasks into prompt-driven systems that save time and reduce manual effort.",
  },
];

const supportDetails = [
  {
    label: "Operator",
    value: LEGAL_OPERATOR_DISPLAY,
    href: PARENT_COMPANY_URL
  },
  {
    label: "Support email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`
  },
  ...(VERIFIED_BUSINESS_ADDRESS
    ? [
        {
          label: "Business address",
          value: VERIFIED_BUSINESS_ADDRESS
        }
      ]
    : []),
  {
    label: "Customer care",
    value: CUSTOMER_CARE_EMAIL,
    href: `mailto:${CUSTOMER_CARE_EMAIL}`
  },
  ...(GRIEVANCE_OFFICER.name
    ? [
        {
          label: "Grievance escalation",
          value: `${GRIEVANCE_OFFICER.name}, ${GRIEVANCE_OFFICER.designation || "Grievance Officer"}`,
          href: `mailto:${GRIEVANCE_OFFICER.email || CUSTOMER_CARE_EMAIL}`
        }
      ]
    : []),
  {
    label: "Payment support",
    value: "Use the contact form for payment, subscription, prompt unlock, credit, refund, or delivery issues."
  }
];

export default function ContactPage() {
  return (
    <main>
      <section className="contact-hero">
        <div className="container contact-container">
          <div className="contact-hero-copy">
            <div className="eyebrow">Contact SeyPrompt</div>
            <h1>Need Custom AI Prompts or Solutions?</h1>
            <p>
              We help you create powerful AI prompts and workflows for your
              needs.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-container contact-stack">
          <div className="contact-services-grid">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  className="card contact-service-card"
                  key={service.title}
                >
                  <div className="contact-service-icon" aria-hidden="true">
                    <Icon size={26} strokeWidth={2.2} />
                  </div>

                  <h2>{service.title}</h2>

                  <p className="muted">{service.description}</p>
                </article>
              );
            })}
          </div>

          <ContactForm />

          <section className="panel contact-billing-card">
            <div>
              <div className="eyebrow">Support details</div>
              <h2>Account, billing, and policy help</h2>
              <p className="muted">
                For payment support, include your SeyPrompt account email and
                order or Razorpay reference if available. Never share card
                numbers, CVV, OTPs, banking passwords, or account passwords.
              </p>
            </div>
            <div className="contact-support-grid">
              {supportDetails.map((detail) => (
                <div className="contact-support-item" key={detail.label}>
                  <span>{detail.label}</span>
                  {detail.href ? (
                    <a href={detail.href} rel="noopener noreferrer" target={detail.href.startsWith("http") ? "_blank" : undefined}>
                      {detail.value}
                    </a>
                  ) : (
                    <strong>{detail.value}</strong>
                  )}
                </div>
              ))}
            </div>
            <div className="contact-support-actions">
              <span>
                <CreditCard aria-hidden="true" size={18} />
                Payment, subscription, and refund support
              </span>
              <span>
                <ShieldCheck aria-hidden="true" size={18} />
                Privacy requests and account safety
              </span>
            </div>
          </section>

          <aside className="panel contact-social-card">
            <div>
              <h2>Follow SeyPrompt</h2>
              <p className="muted">
                Get fresh prompt ideas, creator workflows, and practical AI
                examples between site updates.
              </p>
            </div>
            <SocialLinks className="contact-social-links" />
          </aside>
        </div>
      </section>
    </main>
  );
}
