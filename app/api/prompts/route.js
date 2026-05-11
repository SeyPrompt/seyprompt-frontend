import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiUrl } from "@/utils/api";
import { authCookieName } from "@/lib/auth";

async function readBackendResponse(response) {
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

async function buildBackendRequest(request, token) {
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

export async function POST(request) {
  const token = (await cookies()).get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const backendRequest = await buildBackendRequest(request, token);

  const response = await fetch(apiUrl("/api/prompts"), {
    method: "POST",
    ...backendRequest
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
