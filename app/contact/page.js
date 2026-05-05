import { ContactForm } from "@/components/contact-form";

export const metadata = {
  title: "Contact SeyPrompt - Custom AI Prompts & Support",
  description:
    "Need custom AI prompts or AI solutions? Contact SeyPrompt for personalized help."
};

const services = [
  {
    icon: "C",
    title: "Custom AI Prompts",
    description:
      "Get tailored prompts for your audience, workflow, tone, tools, and business goals."
  },
  {
    icon: "O",
    title: "Prompt Optimization",
    description:
      "Improve existing prompts so they produce clearer, more reliable, and more useful outputs."
  },
  {
    icon: "W",
    title: "AI Workflow Setup",
    description:
      "Design practical AI workflows for content, research, operations, customer support, and teams."
  },
  {
    icon: "B",
    title: "Business Automation",
    description:
      "Turn repeatable tasks into prompt-driven systems that save time and reduce manual effort."
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
              We help you create powerful AI prompts and workflows for your needs.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-container contact-stack">
          <div className="contact-services-grid">
            {services.map((service) => (
              <article className="card contact-service-card" key={service.title}>
                <div className="contact-service-icon" aria-hidden="true">
                  {service.icon}
                </div>
                <h2>{service.title}</h2>
                <p className="muted">{service.description}</p>
              </article>
            ))}
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
