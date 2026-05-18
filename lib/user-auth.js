"use client";

import { apiUrl } from "@/utils/api";

export const USER_AUTH_STORAGE_KEY = "seyprompt_user_auth";

export class AuthApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.details = Array.isArray(details) ? details : [];
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredUserAuth() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(USER_AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveUserAuth(auth) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(USER_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearUserAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_AUTH_STORAGE_KEY);
}

async function parseAuthResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body
        ? body.error || body.message || "Request failed."
        : body || "Request failed.";

    throw new AuthApiError(message, {
      status: response.status,
      details: typeof body === "object" && body ? body.details : []
    });
  }

  return body;
}

async function authPost(path, payload) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseAuthResponse(response);
}

export function registerUser(payload) {
  return authPost("/api/auth/register", payload);
}

export function verifyEmail(payload) {
  return authPost("/api/auth/verify-email", payload);
}

export function loginUser(payload) {
  return authPost("/api/auth/user/login", payload);
}

export function forgotPassword(payload) {
  return authPost("/api/auth/forgot-password", payload);
}

export function resetPassword(payload) {
  return authPost("/api/auth/reset-password", payload);
}
