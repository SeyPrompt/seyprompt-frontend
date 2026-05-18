import { proxyAdminRequest } from "../../../_proxy";

export async function PATCH(_request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/users/${id}/restore`, {
    method: "PATCH"
  });
}
