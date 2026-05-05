import Link from "next/link";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptCard } from "@/components/prompt-card";

export default async function HomePage() {
  const promptResponse = await fetchPublicPrompts({ limit: "6" }).catch(() => ({
    data: [],
    pagination: { total: 0 }
  }));

  const prompts = promptResponse.data || [];
  const categories = ["Marketing", "Coding", "Resume", "AI Tools", "Design", "Business"];

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="eyebrow">Prompt operating system</div>
            <h1>Smart Prompts. Better Results.</h1>
            <p>
              Discover, copy, and use the best AI prompts for every use case.
            </p>
            <form className="hero-search" action="/prompts">
              <input name="q" placeholder="Search prompts, tags, tools..." />
              <button className="button" type="submit">
                Search
              </button>
            </form>
            <div className="category-pills" aria-label="Popular categories">
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
          <aside className="hero-visual" aria-label="SeyPrompt product preview">
            <div className="mock-window">
              <div className="mock-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="mock-line long" />
              <div className="mock-input" />
              <div className="mock-line" />
              <div className="mock-line short" />
            </div>
            <div className="float-tile tile-purple">*</div>
            <div className="float-tile tile-teal">&lt;/&gt;</div>
            <div className="float-tile tile-orange">/</div>
          </aside>
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
    </main>
  );
}
