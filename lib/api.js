import { cache } from "react";
import { API_URL } from "@/lib/config";

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
  return apiFetch(`/api/prompts${suffix}`, {
    cache: "no-store"
  });
});

export const fetchPromptBySlug = cache(async (slug) => {
  return apiFetch(`/api/prompts/${slug}`, {
    cache: "no-store"
  });
});

export async function fetchAdminPrompts(token, searchParams = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch(`/api/prompts${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
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
