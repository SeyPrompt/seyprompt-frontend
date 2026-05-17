import Link from "next/link";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { createPageMetadata, getCategoryPath } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI Prompt Use Cases - Marketing, Coding, Resume",
  description:
    "Browse AI prompts by use case including marketing, coding, business, and more.",
  path: "/use-cases",
  keywords: ["AI prompts for marketing", "coding prompts", "resume prompts", "business prompts"]
});

const categories = [
  {
    title: "Marketing",
    description:
      "Plan campaigns, write better copy, generate hooks, and turn rough ideas into polished marketing assets.",
    prompts: [
      "Instagram Hook Generator",
      "Go-To-Market Strategy Blueprint",
      "Email Campaign Angle Finder"
    ]
  },
  {
    title: "Coding",
    description:
      "Explain code, debug issues, generate tests, and make technical work easier to reason through.",
    prompts: [
      "Code Explainer",
      "Bug Diagnosis Assistant",
      "Unit Test Generator"
    ]
  },
  {
    title: "Resume",
    description:
      "Improve resume bullets, tailor applications, and translate work history into stronger career stories.",
    prompts: [
      "Resume Bullet Improver",
      "ATS Keyword Optimizer",
      "Career Summary Writer"
    ]
  },
  {
    title: "Business",
    description:
      "Create operating docs, summarize research, draft plans, and move from messy inputs to clear decisions.",
    prompts: [
      "Business Plan Outline",
      "Meeting Notes Summarizer",
      "Customer Persona Builder"
    ]
  },
  {
    title: "Social Media",
    description:
      "Create posts, captions, scripts, and content calendars with clearer messaging and faster iteration.",
    prompts: [
      "LinkedIn Post Generator",
      "Short-Form Video Script",
      "Content Calendar Planner"
    ]
  }
];

const aiUses = [
  {
    category: "Content Writing",
    title: "Content Creation",
    description:
      "Generate outlines, posts, captions, newsletters, scripts, and fresh angles for your content pipeline."
  },
  {
    category: "Coding",
    title: "Programming",
    description:
      "Explain technical concepts, draft code, review logic, and speed up debugging or documentation."
  },
  {
    category: "Career",
    title: "Job Search",
    description:
      "Improve resumes, tailor cover letters, prepare interviews, and translate experience into stronger stories."
  },
  {
    category: "Automation",
    title: "Business Automation",
    description:
      "Turn repeatable workflows into reusable prompts for summaries, analysis, planning, and operations."
  }
];

export default function UseCasesPage() {
  return (
    <main>
      <section className="cases-hero">
        <div className="container cases-hero-inner">
          <div className="eyebrow">Prompt use cases</div>
          <h1>AI Prompts for Every Use Case</h1>
          <p>Find the perfect prompt for your needs</p>
        </div>
      </section>

      <section className="section">
        <div className="container cases-stack">
          <div className="cases-section-heading">
            <h2>Browse by Category</h2>
            <p className="muted">
              Start with a use case, then jump into the prompt library to find
              ready-to-use examples for your workflow.
            </p>
          </div>

          <div className="cases-category-grid">
            {categories.map((category) => (
              (() => {
                const CategoryIcon = getCategoryIcon(category.title);

                return (
                  <article className="card case-category-card" key={category.title}>
                    <div>
                      <div className="case-card-icon category-icon" aria-hidden="true">
                        <CategoryIcon size={22} />
                      </div>
                      <h3>{category.title}</h3>
                      <p className="muted">{category.description}</p>
                    </div>
                    <ul>
                      {category.prompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                    <Link
                      className="button-secondary compact"
                      href={getCategoryPath(category.title)}
                    >
                      View All
                    </Link>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <section className="section cases-soft-section">
        <div className="container cases-stack">
          <div className="cases-section-heading">
            <h2>Where can you use AI?</h2>
            <p className="muted">
              AI prompts are useful anywhere you need faster thinking, clearer
              writing, or repeatable creative output.
            </p>
          </div>

          <div className="cases-use-grid">
            {aiUses.map((item) => (
              (() => {
                const CategoryIcon = getCategoryIcon(item.category);

                return (
                  <article className="card cases-use-card" key={item.title}>
                    <div className="case-card-icon category-icon" aria-hidden="true">
                      <CategoryIcon size={22} />
                    </div>
                    <h3>{item.title}</h3>
                    <p className="muted">{item.description}</p>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cases-cta">
            <h2>Explore full prompt library</h2>
            <Link className="button" href="/prompts">
              Browse Prompts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
