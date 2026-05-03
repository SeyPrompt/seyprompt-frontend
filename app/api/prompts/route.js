import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";
import { authCookieName } from "@/lib/auth";

async function readBackendResponse(response) {
  return response.json().catch(() => ({
    error: response.ok ? "OK" : "Backend request failed."
  }));
}

export async function POST(request) {
  const token = (await cookies()).get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json();

  const response = await fetch(`${API_URL}/api/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
