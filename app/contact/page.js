import { ContactForm } from "@/components/contact-form";
import { WandSparkles, Sparkles, Workflow, Bot } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

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
        </div>
      </section>
    </main>
  );
}
