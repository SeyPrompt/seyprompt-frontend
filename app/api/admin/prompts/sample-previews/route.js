import { proxyAdminRequest } from "../../_proxy";

export async function POST(request) {
  return proxyAdminRequest("/api/admin/prompts/sample-previews", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
