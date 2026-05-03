import { notFound } from "next/navigation";
import { fetchPromptBySlug } from "@/lib/api";
import { APP_URL } from "@/lib/config";

function descriptionFromPrompt(prompt) {
  const source = prompt.sampleOutput || prompt.prompt || prompt.title;
  return source.replace(/\s+/g, " ").slice(0, 155);
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const prompt = await fetchPromptBySlug(slug);
    const description = descriptionFromPrompt(prompt);
    const url = `${APP_URL}/prompts/${prompt.slug}`;

    return {
      title: prompt.title,
      description,
      alternates: {
        canonical: url
      },
      openGraph: {
        title: `${prompt.title} | SeyPrompt`,
        description,
        url,
        type: "article"
      }
    };
  } catch (_error) {
    return {
      title: "Prompt Not Found"
    };
  }
}

export default async function PromptDetailPage({ params }) {
  const { slug } = await params;
  const prompt = await fetchPromptBySlug(slug).catch(() => null);

  if (!prompt) {
    notFound();
  }

  return (
    <main className="section">
      <div className="container split">
        <article className="panel content-card stack">
          <div>
            <div className="eyebrow">{prompt.category || "General"}</div>
            <h1 className="page-title">{prompt.title}</h1>
          </div>
          {(prompt.tools || []).length ? (
            <div className="pill-row">
              {(prompt.tools || []).map((tool) => (
                <span className="pill pill-alt" key={tool}>
                  {tool}
                </span>
              ))}
            </div>
          ) : null}
          <div className="pill-row">
            {(prompt.tags || []).map((tag) => (
              <span className="pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
          <section>
            <h2>Prompt</h2>
            <div className="prose">{prompt.prompt}</div>
          </section>
          {prompt.sampleOutput ? (
            <section>
              <h2>Sample Output</h2>
              <div className="prose muted">{prompt.sampleOutput}</div>
            </section>
          ) : null}
        </article>

        <aside className="panel sidebar-card stack">
          <div>
            <div className="eyebrow">Tool stack</div>
            <div className="pill-row" style={{ marginTop: 12 }}>
              {(prompt.tools || []).length ? (
                prompt.tools.map((tool) => (
                  <span className="pill" key={tool}>
                    {tool}
                  </span>
                ))
              ) : (
                <span className="muted">No specific tools listed.</span>
              )}
            </div>
          </div>
          <div>
            <div className="eyebrow">Publishing</div>
            <p className="muted">
              Status: published
              <br />
              Visibility: public
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
