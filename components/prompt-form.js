"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function normalizeList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
      title: formData.get("title"),
      category: formData.get("category"),
      tags: normalizeList(formData.get("tags") || ""),
      tools: normalizeList(formData.get("tools") || ""),
      prompt: formData.get("prompt"),
      sampleOutput: formData.get("sampleOutput"),
      visibility: formData.get("visibility"),
      status: formData.get("status")
    };

    const endpoint =
      mode === "create" ? "/api/prompts" : `/api/prompts/${prompt._id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

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
        <input defaultValue={prompt?.title || ""} id="title" name="title" required />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <input defaultValue={prompt?.category || ""} id="category" name="category" />
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
        <textarea defaultValue={prompt?.prompt || ""} id="prompt" name="prompt" required />
      </div>
      <div className="field">
        <label htmlFor="sampleOutput">Sample output</label>
        <textarea
          defaultValue={prompt?.sampleOutput || ""}
          id="sampleOutput"
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
