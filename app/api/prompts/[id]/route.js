import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiUrl } from "@/utils/api";
import { authCookieName } from "@/lib/auth";

async function getToken() {
  return (await cookies()).get(authCookieName)?.value;
}

async function readBackendResponse(response) {
  return response.json().catch(() => ({
    error: response.ok ? "OK" : "Backend request failed."
  }));
}

export async function PUT(request, { params }) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const payload = await request.json();

  const response = await fetch(apiUrl(`/api/prompts/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}

export async function DELETE(_request, { params }) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const response = await fetch(apiUrl(`/api/prompts/${id}`), {
    method: "DELETE",
    headers: {
      "x-admin-key": token,
      Authorization: `Bearer ${token}`
    }
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
