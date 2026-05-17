import { cache } from "react";
import { apiUrl } from "@/utils/api";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizePromptList(response) {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: { total: response.length, page: 1, pages: 1 }
    };
  }

  const data =
    response?.data ||
    response?.prompts ||
    response?.items ||
    response?.results ||
    [];

  return {
    ...response,
    data: toArray(data),
    pagination: response?.pagination || {
      total: toArray(data).length,
      page: Number(response?.page || 1),
      pages: Number(response?.pages || 1)
    }
  };
}

export function isPublicPrompt(prompt) {
  return prompt?.status === "published" && prompt?.visibility === "public";
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body?.error
        ? body.error
        : "Request failed.";

    throw new Error(message);
  }

  return body;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: options.cache || "no-store"
  });

  return parseResponse(response);
}

export const fetchPublicPrompts = cache(async (searchParams = {}) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch(`/api/public/prompts${suffix}`, {
    cache: "no-store"
  });

  return normalizePromptList(response);
});

function normalizeTaxonomyList(response, key) {
  const values = Array.isArray(response)
    ? response
    : response?.[key] || response?.data || response?.items || response?.results || [];

  return toArray(values)
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.name || item?.label || item?.title || item?.value || "";
    })
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function normalizeCategoryRecords(response) {
  const values = Array.isArray(response)
    ? response
    : response?.categories || response?.data || response?.items || response?.results || [];

  return toArray(values)
    .map((item) => {
      if (typeof item === "string") {
        return {
          name: item,
          slug: ""
        };
      }

      return {
        name: item?.name || item?.label || item?.title || item?.value || item?.category || "",
        slug: item?.slug || item?.categorySlug || ""
      };
    })
    .map((item) => ({
      name: String(item.name || "").trim(),
      slug: String(item.slug || "").trim()
    }))
    .filter((item) => item.name);
}

async function fetchPromptTaxonomy(path, key, limit = 6) {
  const response = await apiFetch(path, {
    cache: "no-store"
  });

  return normalizeTaxonomyList(response, key).slice(0, limit);
}

export const fetchPublicCategories = cache(async (limit = 100) => {
  const response = await apiFetch("/api/public/categories", {
    cache: "no-store"
  });

  return normalizeCategoryRecords(response).slice(0, limit);
});

export const fetchPromptCategories = cache(async (limit = 6) =>
  fetchPromptTaxonomy("/api/public/categories", "categories", limit)
);

export const fetchPromptTools = cache(async (limit = 6) => {
  const response = await apiFetch(`/api/public/prompts?limit=1000`, {
    cache: "no-store"
  });
  const prompts = normalizePromptList(response).data;
  const tools = new Set();

  for (const prompt of prompts) {
    for (const tool of toArray(prompt?.tools)) {
      const value = String(tool || "").trim();

      if (value) {
        tools.add(value);
      }
    }
  }

  return [...tools].slice(0, limit);
});

export const fetchPromptBySlug = cache(async (slug) => {
  const prompt = await apiFetch(`/api/public/prompts/${slug}`, {
    cache: "no-store"
  });

  if (!prompt?.slug && !prompt?.title) {
    throw new Error("Prompt not found.");
  }

  return prompt;
});

export async function fetchAdminPrompts(token, searchParams = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiFetch(`/api/admin/prompts${suffix}`, {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  return normalizePromptList(response);
}

export async function fetchAdminPromptById(token, id) {
  return apiFetch(`/api/admin/prompts/${id}`, {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });
}

export async function fetchAdminCategories(token, limit = 100) {
  const response = await apiFetch("/api/admin/categories", {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  return normalizeCategoryRecords(response).slice(0, limit);
}

export async function fetchCurrentAdmin(token) {
  return apiFetch("/api/auth/me", {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });
}
