import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiUrl } from "@/utils/api";
import { authCookieName } from "@/lib/auth";

export async function POST(request) {
  const payload = await request.json();

  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({
    error: response.ok ? "OK" : "Login request failed."
  }));

  if (!response.ok) {
    return NextResponse.json(result, { status: response.status });
  }

  (await cookies()).set(authCookieName, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ user: result.user });
}
