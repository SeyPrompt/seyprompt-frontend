"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutGrid, List, RotateCcw, Search, Table2 } from "lucide-react";
import { PromptCard } from "@/components/prompt-card";
import { trackEvent } from "@/lib/analytics";
import { apiUrl } from "@/utils/api";

const views = [
  { label: "Card", title: "Card view", icon: LayoutGrid },
  { label: "List", title: "List view", icon: List },
  { label: "Table", title: "Table view", icon: Table2 }
];

const filterOptionRequests = {
  categories: {
    emptyLabel: "No Categories Found",
    label: "All Categories",
    path: "/api/prompts/categories"
  },
  tags: {
    emptyLabel: "No Tags Found",
    label: "All Tags",
    path: "/api/prompts/tags"
  },
  tools: {
    emptyLabel: "No Tools Found",
    label: "All Tools",
    path: "/api/prompts/tools"
  }
};

function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mergeSelectedOption(options, selectedValue) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [selectedValue, ...options];
}

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
  category = "",
  tag = "",
  tool = "",
  limit,
  loadFailed = false,
  total,
  children
}) {
  const [view, setView] = useState("Card");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedTag, setSelectedTag] = useState(tag);
  const [selectedTool, setSelectedTool] = useState(tool);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    tags: [],
    tools: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchFilterOptions() {
      setFilterOptionsLoading(true);

      const results = await Promise.all(
        Object.entries(filterOptionRequests).map(async ([key, request]) => {
          try {
            const response = await fetch(apiUrl(request.path), {
              headers: {
                Accept: "application/json"
              }
            });

            if (!response.ok) {
              throw new Error(`Failed to load ${key}.`);
            }

            const data = await response.json();
            return [key, Array.isArray(data?.[key]) ? data[key] : []];
          } catch {
            return [key, []];
          }
        })
      );

      if (active) {
        setFilterOptions(Object.fromEntries(results));
        setFilterOptionsLoading(false);
      }
    }

    fetchFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedCategory(category);
    setSelectedTag(tag);
    setSelectedTool(tool);
  }, [category, tag, tool]);

  const categoryOptions = mergeSelectedOption(filterOptions.categories, selectedCategory);
  const tagOptions = mergeSelectedOption(filterOptions.tags, selectedTag);
  const toolOptions = mergeSelectedOption(filterOptions.tools, selectedTool);
  const hasActiveFilters = Boolean(q || category || tag || tool);

  function renderFilterOptions(options, emptyLabel, selectedValue) {
    if (filterOptionsLoading) {
      return (
        <>
          {selectedValue ? <option value={selectedValue}>{capitalizeFirstLetter(selectedValue)}</option> : null}
          <option value="">Loading...</option>
        </>
      );
    }

    if (!options.length) {
      return <option value="">{emptyLabel}</option>;
    }

    return options.map((option) => (
      <option key={option} value={option}>
        {capitalizeFirstLetter(option)}
      </option>
    ));
  }

  return (
    <>
      <form
        className="filter-bar library-filter-bar"
        method="get"
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);

          trackEvent("prompt_search", {
            event_category: "Search",
            search_term: formData.get("q") || "",
            category: formData.get("category") || "",
            tag: formData.get("tag") || "",
            tool: formData.get("tool") || ""
          });
        }}
      >
        <input
          className="library-search-input"
          defaultValue={q}
          name="q"
          placeholder="Search prompts, tags, tools..."
        />
        <select
          className="library-filter-select"
          disabled={filterOptionsLoading}
          name="category"
          onChange={(event) => {
            setSelectedCategory(event.target.value);
            trackEvent("category_filter_click", {
              event_category: "Filter",
              event_label: event.target.value || "All Categories"
            });
          }}
          value={selectedCategory}
        >
          <option value="">{filterOptionRequests.categories.label}</option>
          {renderFilterOptions(
            categoryOptions,
            filterOptionRequests.categories.emptyLabel,
            selectedCategory
          )}
        </select>
        <select
          className="library-filter-select"
          disabled={filterOptionsLoading}
          name="tool"
          onChange={(event) => {
            setSelectedTool(event.target.value);
            trackEvent("tool_filter_click", {
              event_category: "Filter",
              event_label: event.target.value || "All Tools"
            });
          }}
          value={selectedTool}
        >
          <option value="">{filterOptionRequests.tools.label}</option>
          {renderFilterOptions(toolOptions, filterOptionRequests.tools.emptyLabel, selectedTool)}
        </select>
        <select
          className="library-filter-select"
          disabled={filterOptionsLoading}
          name="tag"
          onChange={(event) => setSelectedTag(event.target.value)}
          value={selectedTag}
        >
          <option value="">{filterOptionRequests.tags.label}</option>
          {renderFilterOptions(tagOptions, filterOptionRequests.tags.emptyLabel, selectedTag)}
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
            onClick={() =>
              trackEvent("cta_click", {
                event_category: "Filter",
                event_label: "Reset prompt filters",
                cta_name: "reset_filters"
              })
            }
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
        <div className="panel empty-state prompt-empty-state">
          <h3>
            {loadFailed
              ? "We could not load the prompt library."
              : hasActiveFilters
                ? "No prompts matched your filters."
                : "No published prompts yet."}
          </h3>
          <p className="muted">
            {loadFailed
              ? "The catalog may be temporarily unavailable. Try again, or request a custom prompt while it comes back."
              : hasActiveFilters
                ? "Try a broader search, clear your filters, or ask SeyPrompt for a custom prompt."
                : "Published prompts will appear here as soon as they are added. You can still request a custom prompt now."}
          </p>
          <div className="empty-state-actions">
            {hasActiveFilters ? (
              <Link className="button-secondary" href="/prompts">
                Clear Filters
              </Link>
            ) : null}
            <Link className="button" href={loadFailed ? "/prompts" : "/contact"}>
              {loadFailed ? "Try Again" : "Request a Prompt"}
            </Link>
            {loadFailed ? (
              <Link className="button-secondary" href="/contact">
                Contact SeyPrompt
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
