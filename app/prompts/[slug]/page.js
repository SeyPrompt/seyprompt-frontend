import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPromptBySlug } from "@/lib/api";
import { APP_URL } from "@/lib/config";
import { CopyOpenButton } from "@/components/CopyOpenButton";

function descriptionFromPrompt(prompt) {
  const sampleOutput =
    prompt.sampleOutput && typeof prompt.sampleOutput === "object"
      ? prompt.sampleOutput.value
      : prompt.sampleOutput;
  const source = sampleOutput || prompt.prompt || prompt.title;
  return source.replace(/\s+/g, " ").slice(0, 155);
}

function SampleOutputDisplay({ prompt }) {
  const sampleOutput = prompt.sampleOutput;

  if (!sampleOutput) {
    return null;
  }

  if (typeof sampleOutput === "string") {
    return <div className="prose content-box sample-box">{sampleOutput}</div>;
  }

  if (sampleOutput.type === "text") {
    return <div className="prose content-box sample-box">{sampleOutput.value}</div>;
  }

  if (sampleOutput.type === "image") {
    return (
      <div className="sample-media-box">
        <img
          alt={sampleOutput.fileName || `${prompt.title} sample output`}
          className="sample-output-image"
          src={sampleOutput.value}
        />
        {sampleOutput.fileName ? <p className="muted">{sampleOutput.fileName}</p> : null}
      </div>
    );
  }

  if (sampleOutput.type === "pdf") {
    return (
      <div className="sample-media-box">
        <iframe
          className="sample-output-pdf"
          src={sampleOutput.value}
          title={sampleOutput.fileName || `${prompt.title} PDF sample output`}
        />
        <a
          className="button-secondary"
          href={sampleOutput.value}
          rel="noopener noreferrer"
          target="_blank"
        >
          View / Download PDF
        </a>
        {sampleOutput.fileName ? <p className="muted">{sampleOutput.fileName}</p> : null}
      </div>
    );
  }

  return null;
}

function hasSampleOutput(sampleOutput) {
  if (!sampleOutput) {
    return false;
  }

  if (typeof sampleOutput === "string") {
    return Boolean(sampleOutput.trim());
  }

  return Boolean(sampleOutput.value);
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
          <Link className="back-link" href="/prompts">
            &lt;- Back to library
          </Link>
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
            <div className="prose content-box">{prompt.prompt}</div>
          </section>
          {hasSampleOutput(prompt.sampleOutput) ? (
            <section>
              <h2>Sample Output</h2>
              <SampleOutputDisplay prompt={prompt} />
            </section>
          ) : null}
          <CopyOpenButton text={prompt.prompt} />
        </article>

        <aside className="panel sidebar-card stack">
          <div>
            <div className="eyebrow">Details</div>
            <dl className="metadata-list">
              <div>
                <dt>Category</dt>
                <dd>{prompt.category || "General"}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : "-"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="status-badge">Published</span>
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <div className="eyebrow">Related prompts</div>
            <div className="related-list">
              {(prompt.tags || []).slice(0, 3).map((tag) => (
                <Link href={{ pathname: "/prompts", query: { tag } }} key={tag}>
                  #{tag}
                  <span>&gt;</span>
                </Link>
              ))}
              {!(prompt.tags || []).length ? (
                <p className="muted">Browse the full library for more prompts.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
