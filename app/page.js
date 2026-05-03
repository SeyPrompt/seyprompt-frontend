import Link from "next/link";
import Image from "next/image";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptCard } from "@/components/prompt-card";

export default async function HomePage() {
  const promptResponse = await fetchPublicPrompts({ limit: "6" }).catch(() => ({
    data: [],
    pagination: { total: 0 }
  }));

  const prompts = promptResponse.data || [];

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="card hero-card">
            <div className="eyebrow">Prompt operating system</div>
            <h1>SeyPrompt turns useful prompts into a living, searchable library.</h1>
            <p>
              A server-rendered public catalog for fast discovery, paired with a
              focused admin workspace for drafting, tagging, publishing, and refining
              your strongest prompt assets.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/prompts">
                Browse library
              </Link>
              <Link className="button-secondary" href="/admin/prompts">
                Admin panel
              </Link>
            </div>
          </div>
          <aside className="hero-visual" aria-label="SeyPrompt product preview">
            <Image
              src="/images/seyprompt-hero.png"
              alt="Layered prompt library cards and search facets"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 42vw"
            />
          </aside>
          <aside className="stats-strip" aria-label="SeyPrompt highlights">
            <div className="stat-list">
              <div className="stat-item">
                <div className="stat-label">Published prompts</div>
                <div className="stat-value">{promptResponse.pagination?.total || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Rendering mode</div>
                <div className="stat-value">SSR-first</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Admin flow</div>
                <div className="stat-value">JWT-secured</div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Fresh prompts</div>
              <h2>Latest published entries</h2>
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
