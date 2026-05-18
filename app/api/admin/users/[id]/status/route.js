import {
  buildBackendRequest,
  getAdminToken,
  readBackendResponse
} from "../../../_proxy";
import { apiUrl } from "@/utils/api";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const backendRequest = await buildBackendRequest(request, token);
  const response = await fetch(apiUrl(`/api/admin/users/${id}/status`), {
    method: "PATCH",
    ...backendRequest
  });

  const result = await readBackendResponse(response);
  return NextResponse.json(result, { status: response.status });
}
