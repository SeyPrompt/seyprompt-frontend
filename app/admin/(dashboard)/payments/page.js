import {
  fetchAdminEntitlements,
  fetchAdminPayments,
  fetchAdminPlans,
  fetchAdminPrompts,
  fetchAdminUsers
} from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";
import { AdminPaymentsManager } from "@/components/admin-payment-management";

export const metadata = {
  title: "Admin Payments",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function AdminPaymentsPage({ searchParams }) {
  const token = await requireAdminToken();
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.status || "";

  const [orders, entitlements, plans, users, prompts] = await Promise.all([
    fetchAdminPayments(token, { status, limit: "100" }).catch(() => ({ data: [] })),
    fetchAdminEntitlements(token).catch(() => ({ data: [] })),
    fetchAdminPlans(token).catch(() => ({ data: [] })),
    fetchAdminUsers(token, { limit: "100", sortBy: "createdAt", sortOrder: "desc" }).catch(() => ({ data: [] })),
    fetchAdminPrompts(token, { limit: "100", status: "published" }).catch(() => ({ data: [] }))
  ]);

  return (
    <div className="stack">
      <form className="admin-toolbar" method="get">
        <select defaultValue={status} name="status">
          <option value="">All payment statuses</option>
          <option value="created">Created</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <button className="button" type="submit">
          Filter
        </button>
      </form>
      <AdminPaymentsManager
        entitlements={entitlements.data || []}
        orders={orders.data || []}
        plans={plans.data || []}
        prompts={prompts.data || []}
        users={users.data || []}
      />
    </div>
  );
}
