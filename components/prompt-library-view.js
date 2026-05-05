"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { PromptCard } from "@/components/prompt-card";

const views = ["Card", "List", "Table"];

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
                <div className="pill-row">
                  {(prompt.tools || []).slice(0, 3).map((tool) => (
                    <span className="pill pill-alt" key={tool}>
                      {tool}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <span className="status-badge">Published</span>
              </td>
              <td>
                <div className="prompt-actions">
                  <CopyButton className="compact" text={prompt.prompt} />
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
      <form className="filter-bar library-filter-bar" method="get">
        <input defaultValue={q} name="q" placeholder="Search prompts, tags, tools..." />
        <select defaultValue={category} name="category">
          <option value="">All Categories</option>
          <option value="Marketing">Marketing</option>
          <option value="Coding">Coding</option>
          <option value="Resume">Resume</option>
          <option value="Business">Business</option>
          <option value="Design">Design</option>
        </select>
        <select defaultValue="">
          <option value="">All Tools</option>
          <option value="ChatGPT">ChatGPT</option>
          <option value="Claude">Claude</option>
          <option value="Midjourney">Midjourney</option>
          <option value="Canva">Canva</option>
        </select>
        <select defaultValue={tag} name="tag">
          <option value="">All Tags</option>
          <option value="marketing">marketing</option>
          <option value="coding">coding</option>
          <option value="resume">resume</option>
          <option value="productivity">productivity</option>
        </select>
        <input name="limit" type="hidden" value={limit} />
        <button className="button" type="submit">
          Search
        </button>
        <Link className="button-secondary" href="/prompts">
          Reset
        </Link>
        <div className="view-switcher" aria-label="Prompt view switcher">
          {views.map((item) => (
            <button
              className={`view-button${view === item ? " active" : ""}`}
              key={item}
              onClick={() => setView(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </form>

      <div className="section-header">
        <div>
          <strong>{total || 0}</strong>{" "}
          <span className="muted">published prompts found</span>
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
