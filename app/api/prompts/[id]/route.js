import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/config";
import { authCookieName } from "@/lib/auth";

async function getToken() {
  return (await cookies()).get(authCookieName)?.value;
}

export async function PUT(request, { params }) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const payload = await request.json();

  const response = await fetch(`${API_URL}/api/prompts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}

export async function DELETE(_request, { params }) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const response = await fetch(`${API_URL}/api/prompts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
