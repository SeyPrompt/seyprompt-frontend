"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function normalizeList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validatePrompt(payload) {
  if (!payload.title || payload.title.length < 3 || payload.title.length > 120) {
    return "Title must be between 3 and 120 characters.";
  }

  if (!payload.slug) {
    return "Slug is required.";
  }

  if (!payload.prompt || payload.prompt.length < 10 || payload.prompt.length > 10000) {
    return "Prompt must be between 10 and 10,000 characters.";
  }

  if (payload.category.length > 80) {
    return "Category must be 80 characters or fewer.";
  }

  if (payload.sampleOutput.length > 10000) {
    return "Sample output must be 10,000 characters or fewer.";
  }

  if (!["public", "private"].includes(payload.visibility)) {
    return "Visibility must be public or private.";
  }

  if (!["draft", "published", "archived"].includes(payload.status)) {
    return "Status must be draft, published, or archived.";
  }

  return "";
}

export function PromptForm({ mode, prompt }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      tags: normalizeList(formData.get("tags") || ""),
      tools: normalizeList(formData.get("tools") || ""),
      prompt: String(formData.get("prompt") || "").trim(),
      sampleOutput: String(formData.get("sampleOutput") || "").trim(),
      visibility: String(formData.get("visibility") || "public"),
      status: String(formData.get("status") || "published")
    };

    const validationError = validatePrompt(payload);

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "create" ? "/api/prompts" : `/api/prompts/${prompt._id || prompt.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.details?.length) {
        setError(result.details.map((item) => item.message).join(" "));
      } else {
        setError(result.error || "Unable to save prompt.");
      }
      setLoading(false);
      return;
    }

    router.push("/admin/prompts");
    router.refresh();
  }

  return (
    <form className="panel form-card stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          defaultValue={prompt?.title || ""}
          id="title"
          maxLength={120}
          minLength={3}
          name="title"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          defaultValue={prompt?.slug || ""}
          id="slug"
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="launch-plan-generator"
          required
        />
        <span className="field-hint muted">
          Lowercase letters, numbers, and hyphens. Must be unique.
        </span>
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <input
          defaultValue={prompt?.category || ""}
          id="category"
          maxLength={80}
          name="category"
        />
      </div>
      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input
          defaultValue={(prompt?.tags || []).join(", ")}
          id="tags"
          name="tags"
          placeholder="instagram, hooks, copywriting"
        />
        <span className="field-hint muted">Comma-separated values.</span>
      </div>
      <div className="field">
        <label htmlFor="tools">Tools</label>
        <input
          defaultValue={(prompt?.tools || []).join(", ")}
          id="tools"
          name="tools"
          placeholder="ChatGPT, Canva, Notion"
        />
      </div>
      <div className="field">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          defaultValue={prompt?.prompt || ""}
          id="prompt"
          maxLength={10000}
          minLength={10}
          name="prompt"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="sampleOutput">Sample output</label>
        <textarea
          defaultValue={prompt?.sampleOutput || ""}
          id="sampleOutput"
          maxLength={10000}
          name="sampleOutput"
        />
      </div>
      <div className="toolbar">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="visibility">Visibility</label>
          <select
            defaultValue={prompt?.visibility || "public"}
            id="visibility"
            name="visibility"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="status">Status</label>
          <select defaultValue={prompt?.status || "published"} id="status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Saving..." : mode === "create" ? "Create Prompt" : "Update Prompt"}
      </button>
    </form>
  );
}
