import {
  buildBackendRequest,
  getAdminToken,
  proxyAdminRequest,
  readBackendResponse
} from "../../_proxy";
import { apiUrl } from "@/utils/api";
import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/users/${id}`, {
    cache: "no-store"
  });
}

export async function PUT(request, { params }) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const backendRequest = await buildBackendRequest(request, token);
  const response = await fetch(apiUrl(`/api/admin/users/${id}`), {
    method: "PUT",
    ...backendRequest
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/users/${id}`, {
    method: "DELETE"
  });
}
