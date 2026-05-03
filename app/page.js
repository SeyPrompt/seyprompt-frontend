import Link from "next/link";
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
            <div className="eyebrow">Prompt Operating System</div>
            <h1>Publish searchable prompt assets with server-rendered speed.</h1>
            <p>
              SeyPrompt gives you a public-facing prompt library for discovery and a
              private admin panel for managing copy, tools, categories, and publishing
              states without splitting into two apps.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/prompts">
                Explore Prompt Library
              </Link>
              <Link className="button-secondary" href="/admin/prompts">
                Open Admin Panel
              </Link>
            </div>
          </div>
          <aside className="card stats-card">
            <div className="stat-list">
              <div className="stat-item">
                <div className="stat-label">Published prompts</div>
                <div className="stat-value">{promptResponse.pagination?.total || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Rendering mode</div>
                <div className="stat-value">Server-side by default</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Admin flow</div>
                <div className="stat-value">JWT-backed via secure cookie proxy</div>
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
                <PromptCard key={prompt._id} prompt={prompt} />
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
