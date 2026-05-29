"use client";

import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPromptCategories, normalizeCategories } from "@/lib/prompt-metadata";

const MAX_SAMPLE_OUTPUT_FILE_SIZE = 10 * 1024 * 1024;
const SAMPLE_OUTPUT_URL_TYPES = ["image", "video", "pdf", "file"];
const SAMPLE_OUTPUT_TYPES = ["text", ...SAMPLE_OUTPUT_URL_TYPES];

function normalizeList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCategoryInput(value) {
  if (Array.isArray(value)) {
    return normalizeCategories(value);
  }

  try {
    const parsed = JSON.parse(String(value || "[]"));
    return normalizeCategories(parsed);
  } catch {
    return normalizeCategories(normalizeList(value));
  }
}

function normalizeTaxonomyResponse(data) {
  const values = Array.isArray(data)
    ? data
    : data?.categories || data?.data || data?.items || data?.results || [];

  return normalizeCategories(
    values.map((item) =>
      typeof item === "string"
        ? item
        : item?.name || item?.label || item?.title || item?.value || ""
    )
  );
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

  if (payload.description.length > 1000) {
    return "Description must be 1,000 characters or fewer.";
  }

  if (payload.tips.length > 5000) {
    return "Tips must be 5,000 characters or fewer.";
  }

  if (payload.notes.length > 5000) {
    return "Internal notes must be 5,000 characters or fewer.";
  }

  if (!Array.isArray(payload.categories)) {
    return "Categories must be a list.";
  }

  if (payload.categories.some((category) => !category || category.length > 80)) {
    return "Each category must be a non-empty value of 80 characters or fewer.";
  }

  if (payload.sampleOutput?.value?.length > 10000) {
    return "Sample output must be 10,000 characters or fewer.";
  }

  if (!SAMPLE_OUTPUT_TYPES.includes(payload.sampleOutputType)) {
    return "Sample output type must be text, image, video, PDF, or file.";
  }

  if (payload.sampleOutputUrl && !SAMPLE_OUTPUT_URL_TYPES.includes(payload.sampleOutputType)) {
    return "Direct sample output URL type must be image, video, PDF, or file.";
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

  if (
    payload.featuredOrder !== undefined &&
    (!Number.isFinite(payload.featuredOrder) || payload.featuredOrder < 0)
  ) {
    return "Featured order must be 0 or greater.";
  }

  return "";
}

function getInitialSampleOutput(prompt) {
  const sampleOutput = prompt?.sampleOutput;
  const topLevelType = String(prompt?.sampleOutputType || "").trim();
  const topLevelFileName = String(prompt?.sampleOutputFileName || "").trim();
  const validTopLevelType = SAMPLE_OUTPUT_TYPES.includes(topLevelType)
    ? topLevelType
    : "";

  if (sampleOutput && typeof sampleOutput === "object") {
    return {
      type: SAMPLE_OUTPUT_TYPES.includes(sampleOutput.type)
        ? sampleOutput.type
        : validTopLevelType || "text",
      value: sampleOutput.value || "",
      fileName: sampleOutput.fileName || topLevelFileName,
      provider: sampleOutput.provider || "",
      publicId: sampleOutput.publicId || "",
      resourceType: sampleOutput.resourceType || "",
      format: sampleOutput.format || "",
      bytes: sampleOutput.bytes || ""
    };
  }

  return {
    type: validTopLevelType || "text",
    value: typeof sampleOutput === "string" ? sampleOutput : "",
    fileName: topLevelFileName,
    provider: "",
    publicId: "",
    resourceType: "",
    format: "",
    bytes: ""
  };
}

export function PromptForm({ mode, prompt }) {
  const router = useRouter();
  const slugEditedRef = useRef(Boolean(prompt?.slug));
  const initialSampleOutput = getInitialSampleOutput(prompt);
  const initialCategories = getPromptCategories(prompt);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categorySelectValues, setCategorySelectValues] = useState([]);
  const [sampleOutputType, setSampleOutputType] = useState(initialSampleOutput.type);
  const [sampleOutputMode, setSampleOutputMode] = useState(
    SAMPLE_OUTPUT_URL_TYPES.includes(initialSampleOutput.type) && initialSampleOutput.value
      ? "direct-url"
      : "upload"
  );
  const [isFeatured, setIsFeatured] = useState(Boolean(prompt?.isFeatured));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchCategoryOptions() {
      try {
        const response = await fetch("/api/admin/categories", {
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to load categories.");
        }

        const data = await response.json();

        if (active) {
          setCategoryOptions(normalizeTaxonomyResponse(data));
        }
      } catch {
        if (active) {
          setCategoryOptions([]);
        }
      }
    }

    fetchCategoryOptions();

    return () => {
      active = false;
    };
  }, []);

  function addCategories(values) {
    const nextCategories = normalizeCategories(Array.isArray(values) ? values : [values]);

    if (!nextCategories.length) {
      return;
    }

    setCategories((currentCategories) =>
      normalizeCategories([...currentCategories, ...nextCategories])
    );
  }

  function addCustomCategory() {
    addCategories(categoryInput);
    setCategoryInput("");
  }

  function removeCategories(values) {
    const removalKeys = new Set(
      normalizeCategories(Array.isArray(values) ? values : [values]).map((category) =>
        category.toLowerCase()
      )
    );

    if (!removalKeys.size) {
      return;
    }

    setCategories((currentCategories) =>
      currentCategories.filter((currentCategory) => !removalKeys.has(currentCategory.toLowerCase()))
    );
    setCategorySelectValues([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const sampleOutputFile = getFileFromFormData(formData, "sampleOutputFile");
    const sampleOutputType = String(formData.get("sampleOutputType") || "text");
    const sampleOutputUrl = String(formData.get("sampleOutputUrl") || "").trim();
    const sampleOutputFileName = String(formData.get("sampleOutputFileName") || "").trim();
    const featuredOrderValue = String(formData.get("featuredOrder") || "").trim();
    const featuredOrder =
      featuredOrderValue === "" ? undefined : Number(featuredOrderValue);
    const sampleOutputMetadata = {
      provider: String(formData.get("sampleOutputProvider") || "").trim(),
      publicId: String(formData.get("sampleOutputPublicId") || "").trim(),
      resourceType: String(formData.get("sampleOutputResourceType") || "").trim(),
      format: String(formData.get("sampleOutputFormat") || "").trim(),
      bytes: Number(formData.get("sampleOutputBytes") || 0) || undefined
    };
    const selectedCategories = normalizeCategories([
      ...normalizeCategoryInput(formData.get("categories") || "[]"),
      categoryInput
    ]);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      tips: String(formData.get("tips") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      image: String(formData.get("image") || "").trim(),
      thumbnail: String(formData.get("thumbnail") || "").trim(),
      category: selectedCategories[0] || String(formData.get("category") || "").trim(),
      categories: selectedCategories,
      tags: normalizeList(formData.get("tags") || ""),
      tools: normalizeList(formData.get("tools") || ""),
      prompt: String(formData.get("prompt") || "").trim(),
      sampleOutputType,
      sampleOutputUrl,
      sampleOutputFileName,
      sampleOutput: {
        type: sampleOutputType,
        value: String(formData.get("sampleOutputText") || "").trim(),
        fileName: sampleOutputFileName,
        ...sampleOutputMetadata
      },
      visibility: String(formData.get("visibility") || "public"),
      status: String(formData.get("status") || "published"),
      isFeatured,
      featuredOrder
    };

    const validationError = validatePrompt(payload, sampleOutputFile);

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "create" ? "/api/admin/prompts" : `/api/admin/prompts/${prompt._id || prompt.id}`;
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
      description: payload.description,
      tips: payload.tips,
      notes: payload.notes,
      image: payload.image,
      thumbnail: payload.thumbnail,
      category: payload.category,
      categories: payload.categories,
      prompt: payload.prompt,
      tags: payload.tags,
      tools: payload.tools,
      visibility: payload.visibility,
      status: payload.status,
      isFeatured: payload.isFeatured
    };

    if (payload.featuredOrder !== undefined) {
      jsonPayload.featuredOrder = payload.featuredOrder;
    }

    if (payload.sampleOutputType === "text") {
      jsonPayload.sampleOutput = payload.sampleOutput;
      jsonPayload.sampleOutputType = payload.sampleOutputType;
      jsonPayload.sampleOutputFileName = payload.sampleOutputFileName;
      return jsonPayload;
    }

    if (payload.sampleOutputUrl) {
      jsonPayload.sampleOutputUrl = payload.sampleOutputUrl;
      jsonPayload.sampleOutputType = payload.sampleOutputType;
      jsonPayload.sampleOutput = {
        ...payload.sampleOutput,
        value: payload.sampleOutputUrl
      };

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
    uploadFormData.append("description", payload.description);
    uploadFormData.append("tips", payload.tips);
    uploadFormData.append("notes", payload.notes);
    uploadFormData.append("image", payload.image);
    uploadFormData.append("thumbnail", payload.thumbnail);
    uploadFormData.append("category", payload.category);
    uploadFormData.append("categories", JSON.stringify(payload.categories));
    uploadFormData.append("prompt", payload.prompt);
    uploadFormData.append("tags", JSON.stringify(payload.tags));
    uploadFormData.append("tools", JSON.stringify(payload.tools));
    uploadFormData.append("visibility", payload.visibility);
    uploadFormData.append("status", payload.status);
    uploadFormData.append("isFeatured", String(payload.isFeatured));
    if (payload.featuredOrder !== undefined) {
      uploadFormData.append("featuredOrder", String(payload.featuredOrder));
    }
    uploadFormData.append("sampleOutputType", payload.sampleOutputType);
    uploadFormData.append("sampleOutputFileName", payload.sampleOutputFileName);
    uploadFormData.append("sampleOutputFile", sampleOutputFile);

    return uploadFormData;
  }

  const categorySelectOptions = normalizeCategories([...categoryOptions, ...categories]);

  return (
    <form className="panel form-card stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="categorySelect">Category</label>
        <input name="category" readOnly type="hidden" value={categories[0] || ""} />
        <input name="categories" readOnly type="hidden" value={JSON.stringify(categories)} />
        <div className="category-multiselect">
          <select
            id="categorySelect"
            multiple
            onChange={(event) =>
              setCategorySelectValues(
                Array.from(event.target.selectedOptions).map((option) => option.value)
              )
            }
            value={categorySelectValues}
          >
            {categorySelectOptions.length ? (
              categorySelectOptions.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))
            ) : (
              <option disabled value="">
                No categories found
              </option>
            )}
          </select>
          <div className="category-actions">
            <button
              className="button-secondary compact"
              disabled={!categorySelectValues.length}
              onClick={() => addCategories(categorySelectValues)}
              type="button"
            >
              Add
            </button>
            <button
              className="button-secondary compact"
              disabled={!categorySelectValues.length}
              onClick={() => removeCategories(categorySelectValues)}
              type="button"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="category-tag-input">
          <input
            id="categoryInput"
            maxLength={80}
            onChange={(event) => setCategoryInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== ",") {
                return;
              }

              event.preventDefault();
              addCustomCategory();
            }}
            placeholder="Enter a new category"
            value={categoryInput}
          />
          <button
            className="button-secondary compact"
            disabled={!categoryInput.trim()}
            onClick={addCustomCategory}
            type="button"
          >
            Add New
          </button>
        </div>
        {categories.length ? (
          <div className="pill-row">
            {categories.map((category) => (
              <span className="pill category-tag" key={category}>
                {category}
                <button
                  aria-label={`Remove ${category}`}
                  onClick={() => removeCategories(category)}
                  type="button"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <span className="field-hint muted">
          The first category is also saved to the legacy category field.
        </span>
      </div>
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
        <label htmlFor="description">Description</label>
        <textarea
          defaultValue={prompt?.description || ""}
          id="description"
          maxLength={1000}
          name="description"
          placeholder="Short public summary for prompt cards and detail pages."
        />
        <span className="field-hint muted">Shown publicly. Up to 1,000 characters.</span>
      </div>
      <div className="field">
        <label className="field-label-with-icon" htmlFor="tips">
          <Lightbulb aria-hidden="true" size={16} />
          Tips
        </label>
        <textarea
          defaultValue={prompt?.tips || prompt?.notes || ""}
          id="tips"
          maxLength={5000}
          name="tips"
          placeholder="Helpful tips, usage notes, or extra context for customers."
        />
        <span className="field-hint muted">Shown on the public prompt page. Up to 5,000 characters.</span>
      </div>
      <div className="field">
        <label htmlFor="notes">Internal notes</label>
        <textarea
          defaultValue={prompt?.notes || ""}
          id="notes"
          maxLength={5000}
          name="notes"
          placeholder="Private admin notes or migration context."
        />
        <span className="field-hint muted">Saved with the prompt record for admin use.</span>
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
      <div className="form-grid">
        <div className="field">
          <label htmlFor="image">Image URL</label>
          <input
            defaultValue={prompt?.image || ""}
            id="image"
            name="image"
            placeholder="https://example.com/prompt-image.png"
            type="url"
          />
          <span className="field-hint muted">Used for public previews and SEO when available.</span>
        </div>
        <div className="field">
          <label htmlFor="thumbnail">Thumbnail URL</label>
          <input
            defaultValue={prompt?.thumbnail || ""}
            id="thumbnail"
            name="thumbnail"
            placeholder="https://example.com/prompt-thumbnail.png"
            type="url"
          />
        </div>
      </div>
      <div className="sample-output-fields">
        <input name="sampleOutputProvider" readOnly type="hidden" value={initialSampleOutput.provider} />
        <input name="sampleOutputPublicId" readOnly type="hidden" value={initialSampleOutput.publicId} />
        <input name="sampleOutputResourceType" readOnly type="hidden" value={initialSampleOutput.resourceType} />
        <input name="sampleOutputFormat" readOnly type="hidden" value={initialSampleOutput.format} />
        <input name="sampleOutputBytes" readOnly type="hidden" value={initialSampleOutput.bytes} />
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
            <option value="video">Video</option>
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
                      : sampleOutputType === "video"
                        ? "video/mp4,video/webm,video/quicktime,video/*"
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
                    : sampleOutputType === "video"
                      ? "Video URL"
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
                      : sampleOutputType === "video"
                        ? "https://example.com/sample-output.mp4"
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
                    : sampleOutputType === "video"
                      ? "sample-output.mp4"
                    : sampleOutputType === "pdf"
                      ? "sample-output.pdf"
                      : "sample-output.zip"
                }
              />
            </div>
          </>
        )}
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
        <label htmlFor="tags">Tags</label>
        <input
          defaultValue={(prompt?.tags || []).join(", ")}
          id="tags"
          name="tags"
          placeholder="instagram, hooks, copywriting"
        />
        <span className="field-hint muted">Comma-separated values.</span>
      </div>
      <div className="toolbar">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="status">Status</label>
          <select defaultValue={prompt?.status || "published"} id="status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
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
      </div>
      <div className="featured-fieldset">
        <label className="admin-checkbox" htmlFor="isFeatured">
          <input
            checked={isFeatured}
            id="isFeatured"
            name="isFeatured"
            onChange={(event) => setIsFeatured(event.target.checked)}
            type="checkbox"
          />
          Featured on homepage
        </label>
        {isFeatured ? (
          <div className="field">
            <label htmlFor="featuredOrder">Featured order</label>
            <input
              defaultValue={
                prompt?.featuredOrder === undefined || prompt?.featuredOrder === null
                  ? ""
                  : prompt.featuredOrder
              }
              id="featuredOrder"
              min="0"
              name="featuredOrder"
              placeholder="0"
              type="number"
            />
            <span className="field-hint muted">
              Optional. Lower numbers appear earlier when the backend sorts featured prompts.
            </span>
          </div>
        ) : null}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Saving..." : mode === "create" ? "Create Prompt" : "Update Prompt"}
      </button>
    </form>
  );
}
