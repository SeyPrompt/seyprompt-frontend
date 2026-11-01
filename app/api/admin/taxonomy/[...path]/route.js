import { proxyAdminRequest } from "../../_proxy";
import { NextResponse } from "next/server";

async function handle(request, { params }) {
  const { path } = await params;
  const resource = path[0];
  if (!["categories", "tags", "collections", "config", "media", "prompts", "migration", "matching-collections", "bulk-update"].includes(resource) || path.some(part => !/^[a-zA-Z0-9-]+$/.test(part))) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }
  const prefix = ["categories", "tags", "collections"].includes(resource) ? "/api/admin/" : resource === "bulk-update" ? "/api/admin/prompts/" : "/api/admin/taxonomy/";
  const contentType = request.headers.get("content-type") || "";
  const options = { method: request.method, cache: "no-store" };
  if (!["GET", "HEAD"].includes(request.method)) {
    if (contentType.includes("multipart/form-data")) options.body = await request.formData();
    else {
      try { options.body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 }); }
      options.headers = { "Content-Type": "application/json" };
    }
  }
  return proxyAdminRequest(`${prefix}${path.join("/")}${new URL(request.url).search}`, options);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
