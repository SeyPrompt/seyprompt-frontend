import {
  buildBackendRequest,
  getAdminToken,
  proxyAdminRequest,
  readBackendResponse
} from "../_proxy";
import { apiUrl } from "@/utils/api";
import { NextResponse } from "next/server";

export async function GET(request) {
  const search = new URL(request.url).search;
  return proxyAdminRequest(`/api/admin/users${search}`, {
    cache: "no-store"
  });
}

export async function POST(request) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const backendRequest = await buildBackendRequest(request, token);
  const response = await fetch(apiUrl("/api/admin/users"), {
    method: "POST",
    ...backendRequest
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
