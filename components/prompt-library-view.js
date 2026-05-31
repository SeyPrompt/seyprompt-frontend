"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, LayoutGrid, List, RotateCcw, Search, Table2 } from "lucide-react";
import { PromptCard } from "@/components/prompt-card";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import { ToolBadges } from "@/components/tool-badges";
import { trackEvent } from "@/lib/analytics";
import { getPromptCategories, getPrimaryPromptCategory } from "@/lib/prompt-metadata";
import { apiUrl } from "@/utils/api";
import { getCategoryIcon } from "@/utils/categoryIcons";

const views = [
  { label: "Card", title: "Card view", icon: LayoutGrid },
  { label: "List", title: "List view", icon: List },
  { label: "Table", title: "Table view", icon: Table2 }
];

const filterOptionRequests = {
  categories: {
    emptyLabel: "No Categories Found",
    label: "All Categories",
    path: "/api/public/categories"
  },
  tags: {
    emptyLabel: "No Tags Found",
    label: "All Tags",
    path: "/api/public/prompts?limit=1000"
  },
  tools: {
    emptyLabel: "No Tools Found",
    label: "All Tools",
    path: "/api/public/prompts?limit=1000"
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

function normalizeFilterOptions(data, key) {
  if (key === "tags" || key === "tools") {
    const prompts = Array.isArray(data)
      ? data
      : data?.data || data?.prompts || data?.items || data?.results || [];
    const values = new Set();

    for (const prompt of prompts) {
      for (const item of Array.isArray(prompt?.[key]) ? prompt[key] : []) {
        const value = String(item || "").trim();

        if (value) {
          values.add(value);
        }
      }
    }

    return [...values];
  }

  const values = Array.isArray(data)
    ? data
    : data?.[key] || data?.data || data?.items || data?.results || [];

  return values
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.name || item?.label || item?.title || item?.value || ""
    )
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function PromptMetaPills({ prompt, compact = false }) {
  const categories = getPromptCategories(prompt);
  const tags = prompt.tags || [];
  const pills = tags.length
    ? tags.slice(0, compact ? 1 : 2).map((tag) => ({ label: `#${tag}`, key: `tag-${tag}` }))
    : (categories.length ? categories : ["General"])
        .slice(0, compact ? 1 : 2)
        .map((category) => ({ label: category, key: `category-${category}` }));

  return (
    <div className="pill-row library-meta-pills">
      {pills.map((pill) => (
        <span className="pill" key={pill.key}>
          {pill.label}
        </span>
      ))}
    </div>
  );
}

function PromptListItem({ prompt }) {
  const primaryCategory = getPrimaryPromptCategory(prompt);
  const CategoryIcon = getCategoryIcon(primaryCategory);
  const description = prompt.description || "";

  return (
    <article className="library-list-item">
      <div className="prompt-icon library-list-icon" aria-hidden="true">
        <CategoryIcon size={21} />
      </div>
      <div className="library-list-copy">
        <div className="library-list-heading">
          <div>
            <div className="eyebrow">{primaryCategory || "General"}</div>
            <h3>{prompt.title}</h3>
          </div>
        </div>
        <p className="muted library-list-description">
          {description.slice(0, 180)}
          {description.length > 180 ? "..." : ""}
        </p>
        <div className="library-list-meta">
          <PromptMetaPills prompt={prompt} />
          <ToolBadges compact tools={prompt.tools || []} />
        </div>
      </div>
      <div className="library-list-actions">
        <SavedPromptButton className="library-list-save" iconOnly prompt={prompt} />
        <Link className="button compact library-row-link" href={`/prompts/${prompt.slug}`}>
          View <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function PromptTable({ prompts }) {
  return (
    <div className="library-table-wrap">
      <table className="table library-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Tags</th>
            <th>Tools</th>
            <th>Status</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {prompts.map((prompt) => {
            const description = prompt.description || "";

            return (
              <tr key={prompt._id || prompt.id || prompt.slug}>
                <td className="library-table-title-cell">
                  <Link className="library-table-title" href={`/prompts/${prompt.slug}`}>
                    {prompt.title}
                  </Link>
                  <div className="muted library-table-description">
                    {description.slice(0, 90)}
                    {description.length > 90 ? "..." : ""}
                  </div>
                </td>
                <td>
                  <PromptMetaPills prompt={prompt} compact />
                </td>
                <td>
                  <ToolBadges compact tools={prompt.tools || []} />
                </td>
                <td>
                  <span className="status-badge">Published</span>
                </td>
                <td>
                  <div className="library-table-actions">
                    <SavedPromptButton iconOnly prompt={prompt} />
                    <Link
                      aria-label={`View ${prompt.title}`}
                      className="library-table-view"
                      href={`/prompts/${prompt.slug}`}
                    >
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
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
            return [key, normalizeFilterOptions(data, key)];
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
                <PromptListItem key={prompt._id || prompt.id || prompt.slug} prompt={prompt} />
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
