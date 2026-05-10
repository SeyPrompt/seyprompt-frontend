"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, List, RotateCcw, Search, Table2 } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { PromptCard } from "@/components/prompt-card";
import { trackEvent } from "@/lib/analytics";

const views = [
  { label: "Card", title: "Card view", icon: LayoutGrid },
  { label: "List", title: "List view", icon: List },
  { label: "Table", title: "Table view", icon: Table2 }
];

function ToolBadges({ tools = [] }) {
  const [firstTool, ...remainingTools] = tools;

  if (!firstTool) {
    return null;
  }

  return (
    <div className="pill-row tool-row compact-tool-row">
      <span className="pill pill-alt">{firstTool}</span>
      {remainingTools.length ? (
        <span className="pill pill-alt tool-count-badge">+{remainingTools.length}</span>
      ) : null}
    </div>
  );
}

function PromptTable({ prompts }) {
  return (
    <div className="panel library-table-wrap">
      <table className="table library-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Tools</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prompts.map((prompt) => (
            <tr key={prompt._id || prompt.id || prompt.slug}>
              <td>
                <strong>{prompt.title}</strong>
                <div className="muted">
                  {prompt.prompt.slice(0, 90)}
                  {prompt.prompt.length > 90 ? "..." : ""}
                </div>
              </td>
              <td>
                <span className="pill">{prompt.category || "General"}</span>
              </td>
              <td>
                <ToolBadges tools={prompt.tools || []} />
              </td>
              <td>
                <span className="status-badge">Published</span>
              </td>
              <td>
                <div className="prompt-actions">
                  <CopyButton
                    className="compact"
                    text={prompt.prompt}
                    trackingLabel={prompt.slug || prompt.title}
                  />
                  <Link className="button compact" href={`/prompts/${prompt.slug}`}>
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PromptLibraryView({
  prompts,
  q,
  category,
  tag,
  limit,
  total,
  children
}) {
  const [view, setView] = useState("Card");

  return (
    <>
      <form
        className="filter-bar library-filter-bar"
        method="get"
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);

          trackEvent("search_usage", {
            event_category: "Search",
            search_term: formData.get("q") || "",
            category: formData.get("category") || "",
            tag: formData.get("tag") || ""
          });
        }}
      >
        <input
          className="library-search-input"
          defaultValue={q}
          name="q"
          placeholder="Search prompts, tags, tools..."
        />
        <select className="library-filter-select" defaultValue={category} name="category">
          <option value="">All Categories</option>
          <option value="Marketing">Marketing</option>
          <option value="Coding">Coding</option>
          <option value="Resume">Resume</option>
          <option value="Business">Business</option>
          <option value="Design">Design</option>
        </select>
        <select className="library-filter-select" defaultValue="">
          <option value="">All Tools</option>
          <option value="ChatGPT">ChatGPT</option>
          <option value="Claude">Claude</option>
          <option value="Midjourney">Midjourney</option>
          <option value="Canva">Canva</option>
        </select>
        <select className="library-filter-select" defaultValue={tag} name="tag">
          <option value="">All Tags</option>
          <option value="marketing">marketing</option>
          <option value="coding">coding</option>
          <option value="resume">resume</option>
          <option value="productivity">productivity</option>
        </select>
        <input name="limit" type="hidden" value={limit} />
        <div className="library-filter-actions">
          <button
            aria-label="Search prompts"
            className="button library-icon-button library-search-button"
            title="Search"
            type="submit"
          >
            <Search size={20} aria-hidden="true" />
          </button>
          <Link
            aria-label="Reset filters"
            className="button-secondary library-icon-button library-reset-button"
            href="/prompts"
            title="Reset"
          >
            <RotateCcw size={20} aria-hidden="true" />
          </Link>
        </div>
      </form>

      <div className="section-header library-results-header">
        <div>
          <strong>{total || 0}</strong>{" "}
          <span className="muted">published prompts found</span>
        </div>
        <div className="view-switcher" aria-label="Prompt view switcher">
          {views.map(({ label, title, icon: Icon }) => (
            <button
              aria-label={title}
              className={`view-button${view === label ? " active" : ""}`}
              key={label}
              onClick={() => setView(label)}
              title={title}
              type="button"
            >
              <Icon size={19} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {prompts?.length ? (
        <>
          {view === "Card" ? (
            <div className="grid prompt-grid">
              {prompts.map((prompt) => (
                <PromptCard key={prompt._id || prompt.id || prompt.slug} prompt={prompt} />
              ))}
            </div>
          ) : null}

          {view === "List" ? (
            <div className="prompt-list library-list-view">
              {prompts.map((prompt) => (
                <PromptCard key={prompt._id || prompt.id || prompt.slug} prompt={prompt} />
              ))}
            </div>
          ) : null}

          {view === "Table" ? <PromptTable prompts={prompts} /> : null}

          {children}
        </>
      ) : (
        <div className="panel empty-state">
          <h3>No prompts matched your filters.</h3>
          <p className="muted">Try a broader search or clear your filters.</p>
        </div>
      )}
    </>
  );
}
