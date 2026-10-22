import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { pricingCountryHeaders } from "@/lib/pricing-country";
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

export function normalizeUserList(response) {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: { total: response.length, page: 1, limit: response.length, pages: 1 }
    };
  }

  const data =
    response?.data ||
    response?.users ||
    response?.items ||
    response?.results ||
    [];

  return {
    ...response,
    data: toArray(data),
    pagination: response?.pagination || {
      total: toArray(data).length,
      page: Number(response?.page || 1),
      limit: Number(response?.limit || toArray(data).length || 20),
      pages: Number(response?.pages || 1)
    }
  };
}

export function normalizeRecordList(response, key = "data") {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: { total: response.length, page: 1, pages: 1 }
    };
  }

  const data =
    response?.[key] ||
    response?.data ||
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

export function normalizeSingleRecord(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  if (
    response._id ||
    response.id ||
    response.slug ||
    response.title ||
    response.email
  ) {
    return response;
  }

  const record = response.data || response.user || response.prompt || response;

  if (
    record?._id ||
    record?.id ||
    record?.slug ||
    record?.title ||
    record?.email
  ) {
    return record;
  }

  if (record?.prompt) {
    return record.prompt;
  }

  if (record?.user) {
    return record.user;
  }

  return record;
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

    throw Object.assign(new Error(message), { status: response.status });
  }

  return body;
}

export async function apiFetch(path, options = {}) {
  const countryHeaders = path.startsWith("/api/public/prompts")
    ? pricingCountryHeaders(await headers())
    : {};
  const timeoutMs = Number(options.timeoutMs || 12000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...countryHeaders,
        ...(options.headers || {})
      },
      cache: options.cache || "no-store",
      signal: options.signal || controller.signal
    });

    return parseResponse(response);
  } finally {
    clearTimeout(timeout);
  }
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

export const fetchPublicFeaturedPrompts = cache(async () => {
  const response = await apiFetch("/api/public/prompts/featured", {
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
    : response?.data || response?.items || response?.results || response?.categories || [];

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
        slug: item?.slug || item?.categorySlug || "",
        promptCount:
          item?.promptCount ??
          item?.promptsCount ??
          item?.totalPrompts ??
          item?.count ??
          item?.total ??
          null
      };
    })
    .map((item) => ({
      name: String(item.name || "").trim(),
      slug: String(item.slug || "").trim(),
      promptCount:
        item.promptCount === null || item.promptCount === undefined
          ? null
          : Number(item.promptCount)
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
  const response = await apiFetch(`/api/public/prompts/${slug}`, {
    cache: "no-store"
  });
  const prompt = normalizeSingleRecord(response);

  if (!prompt?.slug && !prompt?.title) {
    throw new Error("Prompt not found.");
  }

  return prompt;
});

export const fetchPromptMetadataBySlug = cache(async (slug) => {
  const response = await apiFetch(`/api/public/prompts/${slug}/metadata`, {
    cache: "no-store"
  });
  const prompt = normalizeSingleRecord(response);

  if (!prompt?.slug && !prompt?.title) {
    throw new Error("Prompt metadata not found.");
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
  const response = await apiFetch(`/api/admin/prompts/${id}`, {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  return normalizeSingleRecord(response);
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

export async function fetchAdminUsers(token, searchParams = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiFetch(`/api/admin/users${suffix}`, {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  return normalizeUserList(response);
}

export async function fetchAdminUserById(token, id) {
  const response = await apiFetch(`/api/admin/users/${id}`, {
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  return normalizeSingleRecord(response);
}

function buildQuery(searchParams = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  }

  return query.toString() ? `?${query.toString()}` : "";
}

function adminHeaders(token) {
  return {
    "x-admin-key": token,
    Authorization: `Bearer ${token}`
  };
}

export async function fetchAdminPlans(token) {
  const response = await apiFetch("/api/admin/plans", {
    headers: adminHeaders(token)
  });

  return normalizeRecordList(response);
}

export async function fetchAdminCoupons(token) {
  const response = await apiFetch("/api/admin/coupons", {
    headers: adminHeaders(token)
  });

  return normalizeRecordList(response);
}

export async function fetchAdminPayments(token, searchParams = {}) {
  const response = await apiFetch(`/api/admin/payments${buildQuery(searchParams)}`, {
    headers: adminHeaders(token)
  });

  return normalizeRecordList(response);
}

export async function fetchAdminEntitlements(token) {
  const response = await apiFetch("/api/admin/entitlements", {
    headers: adminHeaders(token)
  });

  return normalizeRecordList(response);
}
