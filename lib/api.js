import { cache } from "react";
import { API_URL } from "@/lib/config";

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
  const response = await fetch(`${API_URL}${path}`, {
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
  const response = await apiFetch(`/api/prompts${suffix}`, {
    cache: "no-store"
  });

  const normalized = normalizePromptList(response);
  const publicData = normalized.data.filter(isPublicPrompt);
  const filteredLocally = publicData.length !== normalized.data.length;

  return {
    ...normalized,
    data: publicData,
    pagination: {
      ...normalized.pagination,
      total: filteredLocally ? publicData.length : normalized.pagination?.total ?? publicData.length,
      pages: filteredLocally ? 1 : normalized.pagination?.pages ?? 1
    }
  };
});

export const fetchPromptBySlug = cache(async (slug) => {
  const prompt = await apiFetch(`/api/prompts/${slug}`, {
    cache: "no-store"
  });

  if (!isPublicPrompt(prompt)) {
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

  const response = await apiFetch(`/api/prompts${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return normalizePromptList(response);
}

export async function fetchAdminPromptById(token, id) {
  return apiFetch(`/api/prompts/id/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function fetchCurrentAdmin(token) {
  return apiFetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
