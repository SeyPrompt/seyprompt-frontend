"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_SAMPLE_OUTPUT_FILE_SIZE = 10 * 1024 * 1024;
const SAMPLE_OUTPUT_URL_TYPES = ["image", "pdf", "file"];

function normalizeList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileFromFormData(formData, fieldName) {
  const file = formData.get(fieldName);
  return file instanceof File && file.size > 0 ? file : null;
}

function validatePrompt(payload, sampleOutputFile) {
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

  if (!["text", ...SAMPLE_OUTPUT_URL_TYPES].includes(payload.sampleOutputType)) {
    return "Sample output type must be text, image, PDF, or file.";
  }

  if (payload.sampleOutputUrl && !SAMPLE_OUTPUT_URL_TYPES.includes(payload.sampleOutputType)) {
    return "Direct sample output URL type must be image, PDF, or file.";
  }

  if (sampleOutputFile && sampleOutputFile.size > MAX_SAMPLE_OUTPUT_FILE_SIZE) {
    return "Sample output file must be 10 MB or smaller.";
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
      type: ["text", ...SAMPLE_OUTPUT_URL_TYPES].includes(sampleOutput.type)
        ? sampleOutput.type
        : "text",
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
  const slugEditedRef = useRef(Boolean(prompt?.slug));
  const initialSampleOutput = getInitialSampleOutput(prompt);
  const [sampleOutputType, setSampleOutputType] = useState(initialSampleOutput.type);
  const [sampleOutputMode, setSampleOutputMode] = useState(
    SAMPLE_OUTPUT_URL_TYPES.includes(initialSampleOutput.type) && initialSampleOutput.value
      ? "direct-url"
      : "upload"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const sampleOutputFile = getFileFromFormData(formData, "sampleOutputFile");
    const sampleOutputType = String(formData.get("sampleOutputType") || "text");
    const sampleOutputUrl = String(formData.get("sampleOutputUrl") || "").trim();
    const sampleOutputFileName = String(formData.get("sampleOutputFileName") || "").trim();
    const payload = {
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      tags: normalizeList(formData.get("tags") || ""),
      tools: normalizeList(formData.get("tools") || ""),
      prompt: String(formData.get("prompt") || "").trim(),
      sampleOutputType,
      sampleOutputUrl,
      sampleOutputFileName,
      sampleOutput: {
        type: sampleOutputType,
        value: String(formData.get("sampleOutputText") || "").trim(),
        fileName: sampleOutputFileName
      },
      visibility: String(formData.get("visibility") || "public"),
      status: String(formData.get("status") || "published")
    };

    const validationError = validatePrompt(payload, sampleOutputFile);

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "create" ? "/api/prompts" : `/api/prompts/${prompt._id || prompt.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const requestOptions = sampleOutputFile
      ? {
          method,
          body: buildMultipartPayload(payload, sampleOutputFile)
        }
      : {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildJsonPayload(payload))
        };

    let response;

    try {
      response = await fetch(endpoint, requestOptions);
    } catch {
      setError("Unable to save prompt. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.details?.length) {
        setError(
          result.details
            .map((item) => (typeof item === "string" ? item : item.message))
            .filter(Boolean)
            .join(" ")
        );
      } else {
        setError(result.error || result.message || "Unable to save prompt.");
      }
      setLoading(false);
      return;
    }

    router.push("/admin/prompts");
    router.refresh();
  }

  function buildJsonPayload(payload) {
    const jsonPayload = {
      title: payload.title,
      slug: payload.slug,
      category: payload.category,
      prompt: payload.prompt,
      tags: payload.tags,
      tools: payload.tools,
      visibility: payload.visibility,
      status: payload.status
    };

    if (payload.sampleOutputType === "text") {
      jsonPayload.sampleOutput = payload.sampleOutput;
      return jsonPayload;
    }

    if (payload.sampleOutputUrl) {
      jsonPayload.sampleOutputUrl = payload.sampleOutputUrl;
      jsonPayload.sampleOutputType = payload.sampleOutputType;

      if (payload.sampleOutputFileName) {
        jsonPayload.sampleOutputFileName = payload.sampleOutputFileName;
      }
    }

    return jsonPayload;
  }

  function buildMultipartPayload(payload, sampleOutputFile) {
    const uploadFormData = new FormData();

    uploadFormData.append("title", payload.title);
    uploadFormData.append("slug", payload.slug);
    uploadFormData.append("category", payload.category);
    uploadFormData.append("prompt", payload.prompt);
    uploadFormData.append("tags", JSON.stringify(payload.tags));
    uploadFormData.append("tools", JSON.stringify(payload.tools));
    uploadFormData.append("visibility", payload.visibility);
    uploadFormData.append("status", payload.status);
    uploadFormData.append("sampleOutputFile", sampleOutputFile);

    return uploadFormData;
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
          onChange={(event) => {
            if (mode !== "create" || slugEditedRef.current) {
              return;
            }

            event.currentTarget.form.elements.slug.value = slugify(event.target.value);
          }}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          defaultValue={prompt?.slug || ""}
          id="slug"
          name="slug"
          onChange={() => {
            slugEditedRef.current = true;
          }}
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
            onChange={(event) => {
              const nextType = event.target.value;
              setSampleOutputType(nextType);

              if (nextType !== "text" && sampleOutputType === "text") {
                setSampleOutputMode(
                  SAMPLE_OUTPUT_URL_TYPES.includes(initialSampleOutput.type) &&
                    initialSampleOutput.value
                    ? "direct-url"
                    : "upload"
                );
              }
            }}
            value={sampleOutputType}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
            <option value="file">File</option>
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
              name="sampleOutputText"
              placeholder="Paste the sample response text..."
            />
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="sampleOutputMode">Sample output source</label>
              <select
                id="sampleOutputMode"
                onChange={(event) => setSampleOutputMode(event.target.value)}
                value={sampleOutputMode}
              >
                <option value="upload">Upload file</option>
                <option value="direct-url">Direct URL</option>
              </select>
            </div>

            {sampleOutputMode === "upload" ? (
              <div className="field">
                <label htmlFor="sampleOutputFile">Sample output file optional</label>
                <input
                  accept={
                    sampleOutputType === "image"
                      ? "image/*"
                      : sampleOutputType === "pdf"
                        ? "application/pdf"
                        : undefined
                  }
                  id="sampleOutputFile"
                  key={`${sampleOutputType}-file`}
                  name="sampleOutputFile"
                  type="file"
                />
                <span className="field-hint muted">Uploads up to 10 MB.</span>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="sampleOutputUrl">
                  {sampleOutputType === "image"
                    ? "Image URL"
                    : sampleOutputType === "pdf"
                      ? "PDF URL"
                      : "File URL"}
                </label>
                <input
                  defaultValue={
                    initialSampleOutput.type === sampleOutputType ? initialSampleOutput.value : ""
                  }
                  id="sampleOutputUrl"
                  key={`${sampleOutputType}-value`}
                  name="sampleOutputUrl"
                  placeholder={
                    sampleOutputType === "image"
                      ? "https://example.com/sample-output.png"
                      : sampleOutputType === "pdf"
                        ? "https://example.com/sample-output.pdf"
                        : "https://example.com/sample-output.zip"
                  }
                  type="url"
                />
              </div>
            )}

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
                placeholder={
                  sampleOutputType === "image"
                    ? "sample-output.png"
                    : sampleOutputType === "pdf"
                      ? "sample-output.pdf"
                      : "sample-output.zip"
                }
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
