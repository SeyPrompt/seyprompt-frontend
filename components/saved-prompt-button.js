"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  getSavedPromptIds,
  isAuthError,
  savePrompt,
  savedPromptId,
  unsavePrompt
} from "@/lib/saved-prompts";
import { trackEvent } from "@/lib/analytics";
import { useUserAuth } from "@/components/user-auth-provider";

export function SavedPromptButton({ prompt, className = "" }) {
  const auth = useUserAuth();
  const alertOwnerId = useId();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const promptId = savedPromptId(prompt);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function closeCompetingAlert(event) {
      if (event.detail?.ownerId !== alertOwnerId) {
        setMessage("");
      }
    }

    window.addEventListener("saved-prompt-alert-open", closeCompetingAlert);
    return () => window.removeEventListener("saved-prompt-alert-open", closeCompetingAlert);
  }, [alertOwnerId]);

  useEffect(() => {
    let active = true;

    async function loadSavedState() {
      if (!auth.ready) {
        return;
      }

      if (!auth.isAuthenticated || !promptId) {
        setSaved(false);
        return;
      }

      try {
        const savedPromptIds = await getSavedPromptIds(auth.token);

        if (active) {
          setSaved(savedPromptIds.has(promptId) || savedPromptIds.has(prompt?.slug));
        }
      } catch (error) {
        if (active && isAuthError(error)) {
          setSaved(false);
        }
      }
    }

    loadSavedState();

    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, auth.ready, auth.token, prompt?.slug, promptId]);

  async function toggleSaved() {
    if (!promptId) {
      return;
    }

    if (!auth.isAuthenticated) {
      showAlert("Please log in to save prompts.");
      trackEvent("cta_click", {
        event_category: "Retention",
        event_label: prompt.title || prompt.slug,
        cta_name: "save_prompt_login_required"
      });
      return;
    }

    const wasSaved = saved;
    setSaved(!wasSaved);
    setLoading(true);
    setMessage("");

    try {
      if (wasSaved) {
        await unsavePrompt(auth.token, promptId, [prompt?.slug]);
      } else {
        await savePrompt(auth.token, promptId, [prompt?.slug]);
      }

      trackEvent("cta_click", {
        event_category: "Retention",
        event_label: prompt.title || prompt.slug,
        cta_name: wasSaved ? "remove_saved_prompt" : "save_prompt"
      });
    } catch (error) {
      setSaved(wasSaved);

      if (isAuthError(error)) {
        showAlert("Please log in to save prompts.");
      } else {
        showAlert("Could not update saved prompt. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function showAlert(nextMessage) {
    window.dispatchEvent(
      new CustomEvent("saved-prompt-alert-open", {
        detail: { ownerId: alertOwnerId }
      })
    );
    setMessage(nextMessage);
  }

  const alert = message ? (
    <div
      className="save-prompt-alert-backdrop"
      onClick={() => setMessage("")}
      role="presentation"
    >
      <div
        aria-live="polite"
        className="save-prompt-alert"
        onClick={(event) => event.stopPropagation()}
        role={message.includes("log in") ? "dialog" : "alert"}
      >
        <Bookmark aria-hidden="true" size={20} />
        <div>
          <h2>{message.includes("log in") ? "Login required" : "Save prompt"}</h2>
          <p>{message}</p>
        </div>
        <div className="save-prompt-alert-actions">
          {message.includes("log in") ? (
            <Link className="button compact" href="/login">
              Login
            </Link>
          ) : null}
          <button
            className="button-secondary compact"
            onClick={() => setMessage("")}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        aria-pressed={saved}
        className={`save-prompt-button${saved ? " saved" : ""}${className ? ` ${className}` : ""}`}
        disabled={loading || !auth.ready}
        onClick={toggleSaved}
        title={saved ? "Saved prompt" : "Save prompt"}
        type="button"
      >
        {saved ? (
          <BookmarkCheck aria-hidden="true" size={16} />
        ) : (
          <Bookmark aria-hidden="true" size={16} />
        )}
        <span>{loading ? "Saving..." : saved ? "Saved" : "Save"}</span>
      </button>
      {mounted && alert ? createPortal(alert, document.body) : null}
    </>
  );
}
