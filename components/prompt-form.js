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

  if (payload.sampleOutput?.value?.length > 10000) {
    return "Sample output must be 10,000 characters or fewer.";
  }

  if (!["text", "image", "pdf"].includes(payload.sampleOutput?.type)) {
    return "Sample output type must be text, image, or PDF.";
  }

  if (!["public", "private"].includes(payload.visibility)) {
    return "Visibility must be public or private.";
  }

  if (!["draft", "published", "archived"].includes(payload.status)) {
    return "Status must be draft, published, or archived.";
  }

  return "";
}

function getInitialSampleOutput(prompt) {
  const sampleOutput = prompt?.sampleOutput;

  if (sampleOutput && typeof sampleOutput === "object") {
    return {
      type: ["text", "image", "pdf"].includes(sampleOutput.type) ? sampleOutput.type : "text",
      value: sampleOutput.value || "",
      fileName: sampleOutput.fileName || ""
    };
  }

  return {
    type: "text",
    value: typeof sampleOutput === "string" ? sampleOutput : "",
    fileName: ""
  };
}

export function PromptForm({ mode, prompt }) {
  const router = useRouter();
  const initialSampleOutput = getInitialSampleOutput(prompt);
  const [sampleOutputType, setSampleOutputType] = useState(initialSampleOutput.type);
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
      sampleOutput: {
        type: String(formData.get("sampleOutputType") || "text"),
        value: String(formData.get("sampleOutputValue") || "").trim(),
        fileName: String(formData.get("sampleOutputFileName") || "").trim()
      },
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
      <div className="sample-output-fields">
        <div className="field">
          <label htmlFor="sampleOutputType">Sample output type</label>
          <select
            id="sampleOutputType"
            name="sampleOutputType"
            onChange={(event) => setSampleOutputType(event.target.value)}
            value={sampleOutputType}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {sampleOutputType === "text" ? (
          <div className="field">
            <label htmlFor="sampleOutputValue">Sample output text</label>
            <textarea
              defaultValue={initialSampleOutput.type === "text" ? initialSampleOutput.value : ""}
              id="sampleOutputValue"
              key="sampleOutput-text"
              maxLength={10000}
              name="sampleOutputValue"
              placeholder="Paste the sample response text..."
            />
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="sampleOutputValue">
                {sampleOutputType === "image" ? "Image URL" : "PDF URL"}
              </label>
              <input
                defaultValue={
                  initialSampleOutput.type === sampleOutputType ? initialSampleOutput.value : ""
                }
                id="sampleOutputValue"
                key={`${sampleOutputType}-value`}
                name="sampleOutputValue"
                placeholder={
                  sampleOutputType === "image"
                    ? "https://example.com/sample-output.png"
                    : "https://example.com/sample-output.pdf"
                }
                type="url"
              />
            </div>
            <div className="field">
              <label htmlFor="sampleOutputFileName">File name optional</label>
              <input
                defaultValue={
                  initialSampleOutput.type === sampleOutputType
                    ? initialSampleOutput.fileName
                    : ""
                }
                id="sampleOutputFileName"
                key={`${sampleOutputType}-fileName`}
                name="sampleOutputFileName"
                placeholder={sampleOutputType === "image" ? "sample-output.png" : "sample-output.pdf"}
              />
            </div>
          </>
        )}
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
