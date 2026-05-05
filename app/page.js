import Link from "next/link";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptCard } from "@/components/prompt-card";

export default async function HomePage() {
  const promptResponse = await fetchPublicPrompts({ limit: "6" }).catch(() => ({
    data: [],
    pagination: { total: 0 }
  }));

  const prompts = promptResponse.data || [];
  const categories = ["Marketing", "Coding", "Resume", "Business", "Design"];
  const steps = [
    {
      icon: "1",
      title: "Find a prompt",
      description: "Search by use case, category, tag, or tool to discover the right starting point."
    },
    {
      icon: "2",
      title: "Copy it",
      description: "Grab a polished prompt that is structured, specific, and ready to customize."
    },
    {
      icon: "3",
      title: "Use in AI",
      description: "Paste it into ChatGPT, Claude, Gemini, or your favorite AI workspace."
    }
  ];
  const tools = [
    {
      name: "ChatGPT",
      description: "Best for writing, ideation, coding help, and everyday productivity."
    },
    {
      name: "Claude",
      description: "Great for long-form writing, careful reasoning, and document-heavy work."
    },
    {
      name: "Midjourney",
      description: "A strong choice for visual concepts, image prompts, and creative exploration."
    }
  ];

  return (
    <main>
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <div className="eyebrow">Prompt operating system</div>
            <h1>Smart Prompts. Better Results.</h1>
            <p>
              Discover, copy, and use high-quality AI prompts built for better
              writing, sharper ideas, faster coding, and clearer daily work.
            </p>
            <form className="hero-search" action="/prompts">
              <input name="q" placeholder="Search prompts, tags, tools..." />
              <button className="button" type="submit">
                Search
              </button>
            </form>
            <div className="home-hero-actions">
              <Link className="button" href="/prompts">
                Browse Prompts
              </Link>
              <Link className="button-secondary" href="/ai-prompt-guide">
                Learn Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-category-section">
        <div className="container">
          <div className="category-pills home-category-pills" aria-label="Popular categories">
            {categories.map((category) => (
              <Link
                className="category-pill"
                href={{ pathname: "/prompts", query: { category } }}
                key={category}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container home-stack">
          <div className="home-section-heading">
            <h2>How It Works</h2>
            <p className="muted">
              SeyPrompt keeps prompt discovery simple: find the right prompt, copy
              it, and use it wherever you already work with AI.
            </p>
          </div>
          <div className="home-info-grid">
            {steps.map((step) => (
              <article className="card home-info-card" key={step.title}>
                <div className="home-info-icon" aria-hidden="true">
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p className="muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Trending Prompts</h2>
            </div>
            <Link className="button-secondary" href="/prompts">
              View all prompts
            </Link>
          </div>
          {prompts.length ? (
            <div className="grid prompt-grid">
              {prompts.map((prompt) => (
                <PromptCard key={prompt._id || prompt.id || prompt.slug} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="panel empty-state">
              <h3>No published prompts yet</h3>
              <p className="muted">
                Once prompts are published from the admin panel, they will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section home-soft-section">
        <div className="container home-stack">
          <div className="home-section-heading">
            <h2>Works With Popular AI Tools</h2>
            <p className="muted">
              Use SeyPrompt examples across leading AI platforms and creative tools.
            </p>
          </div>
          <div className="home-tool-grid">
            {tools.map((tool) => (
              <article className="card home-tool-card" key={tool.name}>
                <div className="home-tool-mark" aria-hidden="true">
                  {tool.name.slice(0, 1)}
                </div>
                <h3>{tool.name}</h3>
                <p className="muted">{tool.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
