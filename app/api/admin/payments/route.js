import { proxyAdminRequest } from "../_proxy";

export async function GET(request) {
  const search = new URL(request.url).search;
  return proxyAdminRequest(`/api/admin/payments${search}`, {
    cache: "no-store"
  });
}
