import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPromptBySlug } from "@/lib/api";
import { CopyOpenButton } from "@/components/CopyOpenButton";
import { getCategoryIcon } from "@/utils/categoryIcons";
import {
  absoluteUrl,
  createPageMetadata,
  getPromptImage,
  promptSchema,
  truncateDescription
} from "@/lib/seo";

function descriptionFromPrompt(prompt) {
  const source = prompt.description || prompt.prompt || prompt.title;
  return truncateDescription(source);
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

  if (sampleOutput.type === "pdf" || sampleOutput.type === "file") {
    const label = sampleOutput.type === "pdf" ? "Open PDF" : "Open File";

    return (
      <div className="sample-media-box">
        <a
          className="button-secondary"
          href={sampleOutput.value}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
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
    const path = `/prompts/${prompt.slug}`;
    const image = getPromptImage(prompt);

    return createPageMetadata({
      title: prompt.title,
      description,
      path,
      image,
      type: "article",
      keywords: [
        prompt.category,
        ...(prompt.tools || []),
        ...(prompt.tags || []),
        "AI prompts",
        "prompt engineering"
      ].filter(Boolean)
    });
  } catch (_error) {
    return {
      title: "Prompt Not Found",
      robots: {
        index: false,
        follow: false
      }
    };
  }
}

export default async function PromptDetailPage({ params }) {
  const { slug } = await params;
  const prompt = await fetchPromptBySlug(slug).catch(() => null);

  if (!prompt) {
    notFound();
  }

  const CategoryIcon = getCategoryIcon(prompt.category);

  return (
    <main className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(promptSchema(prompt)) }}
      />
      <div className="container split">
        <article className="panel content-card stack">
          <Link className="back-link" href="/prompts">
            &lt;- Back to library
          </Link>
          <div>
            <div className="detail-title-row">
              <div className="category-icon prompt-icon" aria-hidden="true">
                <CategoryIcon size={22} />
              </div>
              <div className="eyebrow">{prompt.category || "General"}</div>
            </div>
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
          <CopyOpenButton
            description={descriptionFromPrompt(prompt)}
            text={prompt.prompt}
            title={prompt.title}
            url={absoluteUrl(`/prompts/${prompt.slug}`)}
          />
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
