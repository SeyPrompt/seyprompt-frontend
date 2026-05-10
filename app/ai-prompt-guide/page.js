import Link from "next/link";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { UserRound, Target, Layers3, Sparkles } from "lucide-react";

export const metadata = {
  title: "AI Prompt Guide - Learn How to Write Better Prompts",
  description:
    "Learn how to write powerful AI prompts for ChatGPT, Claude, and more. Examples, tips, and best practices included.",
  keywords: [
    "AI prompt guide",
    "how to write prompts",
    "ChatGPT prompts",
    "AI tips"
  ]
};

const structureCards = [
  {
    category: "Prompt Engineering",
    title: "Role",
    label: "Act as a...",
    text: "Tell the AI what expert perspective it should use before it starts."
  },
  {
    category: "Productivity",
    title: "Task",
    label: "What to do",
    text: "Describe the exact job you want completed in plain, specific language."
  },
  {
    category: "Research",
    title: "Context",
    label: "Add details",
    text: "Include audience, goal, constraints, brand tone, or background details."
  },
  {
    category: "Writing",
    title: "Output",
    label: "Expected result",
    text: "Define the format, length, style, or structure you want back."
  }
];

const bestPractices = [
  "Be specific",
  "Add context",
  "Define output format",
  "Use examples"
];

const examples = [
  {
    category: "Marketing",
    prompt:
      "Act as a growth marketer and write 5 short Instagram captions for a fitness brand launching a 30-day challenge."
  },
  {
    category: "Coding",
    prompt:
      "Act as a senior React developer and explain why this component re-renders, then suggest a cleaner implementation."
  },
  {
    category: "Resume",
    prompt:
      "Act as a resume strategist and rewrite these bullet points to highlight measurable product management impact."
  }
];

export default function AiPromptGuidePage() {
  return (
    <main>
      <section className="guide-hero">
        <div className="container guide-hero-grid">
          <div className="guide-hero-copy">
            <div className="eyebrow">AI prompt guide</div>
            <h1>Master AI Prompts Like a Pro</h1>
            <p>
              Learn how to craft powerful prompts that generate better results
              instantly.
            </p>
            <Link className="button" href="/prompts">
              Explore Prompt Library
            </Link>
          </div>
          <div className="guide-hero-card" aria-label="Prompt formula preview">
            <div className="guide-formula-step">
              <UserRound size={24} className="guide-formula-step-icon" />
              Role
            </div>
            <div className="guide-formula-plus">+</div>
            <div className="guide-formula-step">
              <Target size={24} className="guide-formula-step-icon" />
              Task
            </div>
            <div className="guide-formula-plus">+</div>
            <div className="guide-formula-step">
              <Layers3 size={24} className="guide-formula-step-icon" />
              Context
            </div>
            <div className="guide-formula-plus">+</div>
            <div className="guide-formula-step">
              <Sparkles size={24} className="guide-formula-step-icon" />
              Output
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container guide-stack">
          <div className="guide-section-heading">
            <h2>What is an AI Prompt?</h2>
            <p className="muted">
              An AI prompt is the instruction you give to a tool like ChatGPT,
              Claude, or another AI assistant. A strong prompt explains the role,
              task, context, and expected output so the AI can respond with a more
              useful answer.
            </p>
          </div>

          <div className="guide-example-grid">
            <div className="panel guide-example bad">
              <span>Bad Prompt:</span>
              <p>"Write something about marketing"</p>
            </div>
            <div className="panel guide-example good">
              <span>Good Prompt:</span>
              <p>
                "Act as a digital marketing expert and create 5 engaging Instagram
                captions for a fitness brand"
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section guide-soft-section">
        <div className="container guide-stack">
          <div className="guide-section-heading">
            <h2>Prompt Structure</h2>
            <p className="muted">
              The best prompts usually follow a simple structure that gives the AI
              enough direction without making the request confusing.
            </p>
          </div>

          <div className="guide-card-grid">
            {structureCards.map((card) => (
              (() => {
                const getIconForTitle = (title) => {
                  switch (title) {
                    case 'Role': return UserRound;
                    case 'Task': return Target;
                    case 'Context': return Layers3;
                    case 'Output': return Sparkles;
                    default: return UserRound;
                  }
                };
                const Icon = getIconForTitle(card.title);

                return (
                  <article className="card guide-info-card" key={card.title}>
                    <div className="guide-icon category-icon" aria-hidden="true">
                      <Icon size={22} />
                    </div>
                    <div>
                      <span>{card.label}</span>
                      <h3>{card.title}</h3>
                    </div>
                    <p className="muted">{card.text}</p>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container guide-two-column">
          <div className="guide-section-heading">
            <h2>Best Practices</h2>
            <p className="muted">
              A few small improvements can dramatically change the quality of your
              AI results.
            </p>
          </div>
          <div className="panel guide-practice-card">
            {bestPractices.map((practice) => (
              <div className="guide-practice-item" key={practice}>
                <span aria-hidden="true">✓</span>
                {practice}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container guide-stack">
          <div className="guide-section-heading">
            <h2>Examples</h2>
            <p className="muted">
              Use these examples as starting points, then adapt the context and
              output format to your own workflow.
            </p>
          </div>

          <div className="guide-card-grid examples">
            {examples.map((example) => (
              (() => {
                const CategoryIcon = getCategoryIcon(example.category);

                return (
                  <article className="card guide-prompt-example" key={example.category}>
                    <div className="detail-title-row">
                      <div className="category-icon guide-icon" aria-hidden="true">
                        <CategoryIcon size={20} />
                      </div>
                      <div className="eyebrow">{example.category}</div>
                    </div>
                    <p>{example.prompt}</p>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="guide-cta">
            <h2>Start using powerful prompts now</h2>
            <Link className="button" href="/prompts">
              Browse Prompts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
