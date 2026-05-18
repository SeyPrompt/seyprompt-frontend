import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";
import { apiUrl } from "@/utils/api";

export async function getAdminToken() {
  return (await cookies()).get(authCookieName)?.value;
}

export async function readBackendResponse(response) {
  const text = await response.text();

  if (!text) {
    return {
      error: response.ok ? "OK" : "Backend request failed."
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text
    };
  }
}

export async function buildBackendRequest(request, token) {
  const contentType = request.headers.get("content-type") || "";
  const headers = {
    "x-admin-key": token,
    Authorization: `Bearer ${token}`
  };

  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    return {
      headers,
      body: await request.formData()
    };
  }

  return {
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(await request.json())
  };
}

export async function proxyAdminRequest(path, init = {}) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const headers = {
    "x-admin-key": token,
    Authorization: `Bearer ${token}`,
    ...(init.headers || {})
  };

  const response = await fetch(apiUrl(path), {
    ...init,
    headers
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
