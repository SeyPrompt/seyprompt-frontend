import { proxyAdminRequest } from "../_proxy";

export async function GET() {
  return proxyAdminRequest("/api/admin/categories", {
    cache: "no-store"
  });
}
