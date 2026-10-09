"use client";

import { apiUrl } from "@/utils/api";

async function parsePaymentResponse(response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || body.message || "Payment request failed.");
  }

  return body;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function fetchPaymentPlans() {
  const response = await fetch(apiUrl("/api/payments/plans"), {
    cache: "no-store"
  });
  const body = await parsePaymentResponse(response);
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchCreditPlans() {
  const response = await fetch(apiUrl("/api/payments/credit-plans"), {
    cache: "no-store"
  });
  const body = await parsePaymentResponse(response);
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchWallet(token) {
  const response = await fetch(apiUrl("/api/payments/wallet"), {
    headers: authHeaders(token),
    cache: "no-store"
  });
  return parsePaymentResponse(response);
}

export async function fetchMyPaymentOrders(token) {
  const response = await fetch(apiUrl("/api/payments/orders"), {
    headers: authHeaders(token),
    cache: "no-store"
  });
  const body = await parsePaymentResponse(response);
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchMyEntitlements(token) {
  const response = await fetch(apiUrl("/api/payments/entitlements"), {
    headers: authHeaders(token),
    cache: "no-store"
  });
  const body = await parsePaymentResponse(response);
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchUserPrompt(token, slug) {
  const response = await fetch(apiUrl(`/api/user/prompts/${slug}`), {
    headers: authHeaders(token),
    cache: "no-store"
  });

  return parsePaymentResponse(response);
}

export async function createCheckout(token, payload) {
  const response = await fetch(apiUrl("/api/payments/checkout"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  return parsePaymentResponse(response);
}

export async function createPromptCheckout(token, promptId) {
  const response = await fetch(apiUrl("/api/payments/checkout/prompt"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ promptId })
  });

  return parsePaymentResponse(response);
}

export async function createCreditCheckout(token, planId) {
  const response = await fetch(apiUrl("/api/payments/checkout/credits"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ planId })
  });

  return parsePaymentResponse(response);
}

export async function unlockPromptWithCredits(token, promptId) {
  const response = await fetch(apiUrl(`/api/payments/prompts/${promptId}/unlock`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({})
  });

  return parsePaymentResponse(response);
}

export async function verifyCheckout(token, payload) {
  const response = await fetch(apiUrl("/api/payments/verify"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  return parsePaymentResponse(response);
}
