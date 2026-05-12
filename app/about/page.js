import Link from "next/link";
import { BookOpenCheck, Layers3, SearchCheck, Sparkles } from "lucide-react";
import { createPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About SeyPrompt - AI Prompt Library for Better Results",
  description:
    "Learn about SeyPrompt, a practical AI prompt library built to help creators, developers, students, and businesses get better results from AI tools.",
  path: "/about",
  keywords: [
    "about SeyPrompt",
    "AI prompt library",
    "prompt engineering",
    "ChatGPT prompts",
    "Claude prompts",
    "AI prompts for business"
  ]
});

const values = [
  {
    icon: SearchCheck,
    title: "Useful before clever",
    description:
      "Every prompt is shaped around a clear job: write, plan, code, research, design, summarize, or decide with less friction."
  },
  {
    icon: Layers3,
    title: "Built for real workflows",
    description:
      "SeyPrompt organizes prompts by category, tool, tag, and use case so you can find a practical starting point quickly."
  },
  {
    icon: BookOpenCheck,
    title: "Easy to learn from",
    description:
      "The library is designed to show what strong prompts look like, helping you adapt them instead of starting from a blank page."
  },
  {
    icon: Sparkles,
    title: "Better outputs, faster",
    description:
      "Our goal is simple: help you turn rough ideas into sharper AI results with prompts that are specific, structured, and reusable."
  }
];

const audiences = [
  "Creators building content systems",
  "Developers solving technical tasks",
  "Marketers planning campaigns",
  "Students and job seekers improving their work",
  "Businesses creating repeatable AI workflows"
];

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${SITE_NAME}`,
  url: `${SITE_URL}/about`,
  description:
    "SeyPrompt is an AI prompt library for creators, developers, students, and businesses that want clearer, faster results from AI tools.",
  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL
  },
  about: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL
  }
};

export default function AboutPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="eyebrow">About SeyPrompt</div>
          <h1>Helping people get better results from AI prompts</h1>
          <p>
            SeyPrompt is a practical prompt library for anyone who wants to use
            AI with more clarity, structure, and confidence.
          </p>
          <div className="about-hero-actions">
            <Link className="button" href="/prompts">
              Browse Prompts
            </Link>
            <Link className="button-secondary" href="/contact">
              Request Custom Prompts
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-story-grid">
          <div className="about-story-copy">
            <h2>Why SeyPrompt exists</h2>
            <p>
              AI tools are powerful, but the quality of the output still
              depends on the quality of the instruction. SeyPrompt was created
              to make that first step easier: finding a prompt that already has
              the right context, structure, and direction.
            </p>
            <p>
              Instead of treating prompts like one-off tricks, we treat them as
              reusable building blocks for work. The site brings together prompt
              examples for writing, coding, marketing, business planning,
              resumes, design, social media, and more.
            </p>
          </div>

          <aside className="panel about-audience-panel">
            <h2>Built for</h2>
            <ul>
              {audiences.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section about-soft-section">
        <div className="container about-stack">
          <div className="about-section-heading">
            <h2>What guides the library</h2>
            <p className="muted">
              SeyPrompt focuses on prompts that are clear enough to copy,
              flexible enough to customize, and useful enough to bring into
              everyday work.
            </p>
          </div>

          <div className="about-values-grid">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article className="card about-value-card" key={value.title}>
                  <div className="about-value-icon" aria-hidden="true">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h3>{value.title}</h3>
                  <p className="muted">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-cta">
          <h2>Find a prompt for your next AI task</h2>
          <p>
            Explore ready-to-use prompts, learn how strong prompts are
            structured, or reach out for a custom prompt workflow.
          </p>
          <div className="about-cta-actions">
            <Link className="button" href="/prompts">
              Explore Prompt Library
            </Link>
            <Link className="button-secondary" href="/ai-prompt-guide">
              Read the Prompt Guide
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
