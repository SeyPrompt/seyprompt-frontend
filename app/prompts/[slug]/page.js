import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchPromptBySlug, fetchPublicPrompts } from "@/lib/api";
import { CopyButton } from "@/components/CopyButton";
import { CopyOpenButton } from "@/components/CopyOpenButton";
import { RecordPromptView } from "@/components/record-prompt-view";
import { RecentlyViewedPrompts } from "@/components/recently-viewed-prompts";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import {
  getPrimaryPromptCategory,
  getPromptCategories,
  getPromptCategoryLabel
} from "@/lib/prompt-metadata";
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

async function fetchRelatedPrompts(prompt) {
  const requests = [];
  const primaryCategory = getPrimaryPromptCategory(prompt);

  if (primaryCategory) {
    requests.push(fetchPublicPrompts({ category: primaryCategory, limit: "6" }));
  }

  for (const tool of (prompt.tools || []).slice(0, 2)) {
    requests.push(fetchPublicPrompts({ tool, limit: "6" }));
  }

  const responses = await Promise.all(requests.map((request) => request.catch(() => null)));
  const seen = new Set([prompt.slug, prompt._id, prompt.id].filter(Boolean));
  const related = [];

  for (const response of responses) {
    for (const item of response?.data || []) {
      const key = item.slug || item._id || item.id;

      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      related.push(item);

      if (related.length >= 4) {
        return related;
      }
    }
  }

  return related;
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
        ...getPromptCategories(prompt),
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

  const categories = getPromptCategories(prompt);
  const primaryCategory = getPrimaryPromptCategory(prompt);
  const categoryCountLabel =
    categories.length > 1
      ? `${primaryCategory || "General"} +${categories.length - 1}`
      : primaryCategory || "General";
  const CategoryIcon = getCategoryIcon(primaryCategory);
  const relatedPrompts = await fetchRelatedPrompts(prompt);

  return (
    <main className="section">
      <RecordPromptView prompt={prompt} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(promptSchema(prompt)) }}
      />
      <div className="container split">
        <article className="panel content-card stack">
          <Link className="back-link" href="/prompts" aria-label="Back to library">
            <ArrowLeft size={20} />
            <span>Back to library</span>
          </Link>
          <div>
            <div className="detail-title-row">
              <div className="category-icon prompt-icon" aria-hidden="true">
                <CategoryIcon size={22} />
              </div>
              <div className="eyebrow">{primaryCategory || "General"}</div>
            </div>
            <h1 className="page-title">{prompt.title}</h1>
            {prompt.description ? <p className="page-subtitle">{prompt.description}</p> : null}
          </div>
          {categories.length ? (
            <div className="pill-row">
              {categories.map((category) => (
                <span className="pill" key={`category-${category}`}>
                  {category}
                </span>
              ))}
            </div>
          ) : null}
          <section>
            <h2>Prompt</h2>
            <div className="prompt-copy-box">
              <CopyButton
                ariaLabel="Copy prompt"
                className="prompt-inline-copy"
                copiedLabel="Copied!"
                iconOnly
                label="Copy prompt"
                text={prompt.prompt}
                trackingLabel={prompt.title || "prompt"}
              />
              <div className="prose content-box prompt-content-box">{prompt.prompt}</div>
            </div>
          </section>
          {prompt.notes ? (
            <section>
              <h2>Notes</h2>
              <div className="prose content-box">{prompt.notes}</div>
            </section>
          ) : null}
          {(prompt.tools || []).length ? (
            <section>
              <h2>Tools</h2>
              <div className="pill-row">
                {(prompt.tools || []).map((tool) => (
                  <span className="pill pill-alt" key={tool}>
                    {tool}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {hasSampleOutput(prompt.sampleOutput) ? (
            <section>
              <h2>Sample Output</h2>
              <SampleOutputDisplay prompt={prompt} />
            </section>
          ) : null}
          {(prompt.tags || []).length ? (
            <section>
              <h2>Tags</h2>
              <div className="pill-row">
                {(prompt.tags || []).map((tag) => (
                  <span className="pill" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          <section className="prompt-actions-section" aria-label="Prompt actions">
            <div className="prompt-actions-heading">
              <h2>Actions</h2>
              <SavedPromptButton className="prompt-save-action" prompt={prompt} />
            </div>
            <CopyOpenButton
              description={descriptionFromPrompt(prompt)}
              text={prompt.prompt}
              title={prompt.title}
              url={absoluteUrl(`/prompts/${prompt.slug}`)}
            />
          </section>
        </article>

        <aside className="panel sidebar-card stack">
          <div>
            <div className="eyebrow">Details</div>
            <dl className="metadata-list">
              <div>
                <dt>Category</dt>
                <dd>{categoryCountLabel}</dd>
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
              {relatedPrompts.map((relatedPrompt) => (
                <Link href={`/prompts/${relatedPrompt.slug}`} key={relatedPrompt.slug}>
                  <span>
                    {relatedPrompt.title}
                    <small>
                      {getPromptCategoryLabel(
                        relatedPrompt,
                        (relatedPrompt.tools || [])[0] || "Prompt"
                      )}
                    </small>
                  </span>
                  <span>&gt;</span>
                </Link>
              ))}
              {!relatedPrompts.length && primaryCategory ? (
                <Link href={{ pathname: "/prompts", query: { category: primaryCategory } }}>
                  More {primaryCategory} prompts
                  <span>&gt;</span>
                </Link>
              ) : null}
              {!relatedPrompts.length && (prompt.tools || [])[0] ? (
                <Link href={{ pathname: "/prompts", query: { tool: prompt.tools[0] } }}>
                  More {(prompt.tools || [])[0]} prompts
                  <span>&gt;</span>
                </Link>
              ) : null}
              {!relatedPrompts.length && !primaryCategory && !(prompt.tools || []).length ? (
                <p className="muted">Browse the full library for more prompts.</p>
              ) : null}
            </div>
          </div>
          <RecentlyViewedPrompts excludeSlug={prompt.slug} />
        </aside>
      </div>
    </main>
  );
}
