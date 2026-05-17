"use client";

import { apiUrl } from "@/utils/api";

export class SavedPromptsApiError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = "SavedPromptsApiError";
    this.status = status;
  }
}

let cachedToken = null;
let cachedSavedPromptIds = null;
let savedPromptIdsPromise = null;

function promptIdentifier(prompt) {
  return prompt?._id || prompt?.id || prompt?.slug || "";
}

function savedPromptIdentifiers(item) {
  const prompt = item?.prompt || item;
  return [prompt?._id, prompt?.id, prompt?.slug].filter(Boolean);
}

async function parseSavedPromptsResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body
        ? body.error || body.message || "Request failed."
        : body || "Request failed.";

    throw new SavedPromptsApiError(message, { status: response.status });
  }

  return body;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

export function normalizeSavedPrompts(response) {
  const data = Array.isArray(response?.data) ? response.data : [];

  return {
    ...response,
    data,
    pagination: response?.pagination || {
      total: data.length,
      page: 1,
      limit: data.length,
      pages: data.length ? 1 : 0
    }
  };
}

export function savedPromptId(prompt) {
  return promptIdentifier(prompt);
}

export function isAuthError(error) {
  return error?.status === 401 || error?.status === 403;
}

export async function fetchSavedPrompts(token) {
  const response = await fetch(apiUrl("/api/user/saved-prompts"), {
    headers: authHeaders(token),
    cache: "no-store"
  });

  return normalizeSavedPrompts(await parseSavedPromptsResponse(response));
}

export async function getSavedPromptIds(token) {
  if (!token) {
    return new Set();
  }

  if (cachedToken !== token) {
    cachedToken = token;
    cachedSavedPromptIds = null;
    savedPromptIdsPromise = null;
  }

  if (cachedSavedPromptIds) {
    return cachedSavedPromptIds;
  }

  if (!savedPromptIdsPromise) {
    savedPromptIdsPromise = fetchSavedPrompts(token)
      .then((response) => {
        cachedSavedPromptIds = new Set(response.data.flatMap(savedPromptIdentifiers));
        return cachedSavedPromptIds;
      })
      .finally(() => {
        savedPromptIdsPromise = null;
      });
  }

  return savedPromptIdsPromise;
}

export async function savePrompt(token, promptId, identifiers = []) {
  const response = await fetch(apiUrl(`/api/user/saved-prompts/${promptId}`), {
    method: "POST",
    headers: authHeaders(token)
  });

  const body = await parseSavedPromptsResponse(response);

  if (cachedToken === token && cachedSavedPromptIds) {
    for (const id of [promptId, ...identifiers].filter(Boolean)) {
      cachedSavedPromptIds.add(id);
    }
  }

  return body;
}

export async function updateSavedPrompt(token, promptId, payload = {}) {
  const response = await fetch(apiUrl(`/api/user/saved-prompts/${promptId}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  return parseSavedPromptsResponse(response);
}

export async function unsavePrompt(token, promptId, identifiers = []) {
  const response = await fetch(apiUrl(`/api/user/saved-prompts/${promptId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });

  const body = await parseSavedPromptsResponse(response);

  if (cachedToken === token && cachedSavedPromptIds) {
    for (const id of [promptId, ...identifiers].filter(Boolean)) {
      cachedSavedPromptIds.delete(id);
    }
  }

  return body;
}

export function clearSavedPromptCache() {
  cachedToken = null;
  cachedSavedPromptIds = null;
  savedPromptIdsPromise = null;
}
