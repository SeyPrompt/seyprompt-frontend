"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkCheck } from "lucide-react";
import {
  fetchSavedPrompts,
  isAuthError,
  unsavePrompt
} from "@/lib/saved-prompts";
import { trackEvent } from "@/lib/analytics";
import { useUserAuth } from "@/components/user-auth-provider";

export function SavedPromptsClient() {
  const auth = useUserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSavedPrompts() {
      if (!auth.ready) {
        return;
      }

      if (!auth.isAuthenticated) {
        setItems([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetchSavedPrompts(auth.token);

        if (active) {
          setItems(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            isAuthError(loadError)
              ? "Please log in to view saved prompts."
              : "Could not load saved prompts. Please try again."
          );
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSavedPrompts();

    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, auth.ready, auth.token]);

  async function removePrompt(prompt) {
    const promptId = prompt?._id || prompt?.id || prompt?.slug;

    if (!promptId) {
      return;
    }

    const previousItems = items;
    setItems((current) =>
      current.filter((item) => (item.prompt?._id || item.prompt?.id || item.prompt?.slug) !== promptId)
    );
    setError("");

    try {
      await unsavePrompt(auth.token, promptId, [prompt.slug]);
      trackEvent("cta_click", {
        event_category: "Retention",
        event_label: prompt.title || prompt.slug,
        cta_name: "remove_saved_prompt"
      });
    } catch (removeError) {
      setItems(previousItems);
      setError(
        isAuthError(removeError)
          ? "Please log in to manage saved prompts."
          : "Could not remove saved prompt. Please try again."
      );
    }
  }

  if (!auth.ready || loading) {
    return (
      <div className="panel empty-state">
        <BookmarkCheck aria-hidden="true" size={30} />
        <h2>Loading saved prompts...</h2>
      </div>
    );
  }

  if (!auth.isAuthenticated || error.includes("log in")) {
    return (
      <div className="panel empty-state">
        <BookmarkCheck aria-hidden="true" size={30} />
        <h2>Log in to view your saved prompts.</h2>
        <p className="muted">
          Saved prompts are connected to your account so they can follow you across devices.
        </p>
        <Link className="button" href="/login">
          Login
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel empty-state">
        <BookmarkCheck aria-hidden="true" size={30} />
        <h2>{error}</h2>
        <button className="button" onClick={() => window.location.reload()} type="button">
          Try Again
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="panel empty-state">
        <BookmarkCheck aria-hidden="true" size={30} />
        <h2>Save your favorite prompts and reuse them anytime.</h2>
        <p className="muted">
          Bookmark useful prompts from the library or prompt detail pages. They will appear here for your account.
        </p>
        <Link
          className="button"
          href="/prompts"
          onClick={() =>
            trackEvent("cta_click", {
              event_category: "Retention",
              event_label: "Browse prompts from saved page",
              cta_name: "saved_empty_browse_prompts"
            })
          }
        >
          Go to Prompt Library
        </Link>
      </div>
    );
  }

  return (
    <div className="saved-prompts-grid">
      {items.map((item) => {
        const prompt = item.prompt;

        if (!prompt) {
          return null;
        }

        return (
          <article className="card saved-prompt-card" key={item.id || prompt._id || prompt.slug}>
            <div>
              <div className="eyebrow">{prompt.category || "General"}</div>
              <h2>{prompt.title}</h2>
              <p className="muted">
                {prompt.prompt.slice(0, 170)}
                {prompt.prompt.length > 170 ? "..." : ""}
              </p>
            </div>
            <div className="pill-row">
              {(prompt.tools || []).slice(0, 3).map((tool) => (
                <span className="pill pill-alt" key={tool}>
                  {tool}
                </span>
              ))}
            </div>
            <div className="prompt-actions saved-prompt-actions">
              <Link className="button compact" href={`/prompts/${prompt.slug}`}>
                Open
              </Link>
              <button
                className="button-secondary compact"
                onClick={() => removePrompt(prompt)}
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
