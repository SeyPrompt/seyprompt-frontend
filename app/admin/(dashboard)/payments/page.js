import PaymentWebsiteSummary from "@/components/payment-website-summary";
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
  const statuses = ["all", "created", "paid", "failed", "refunded", "cancelled"];
  const status = statuses.includes(resolvedSearchParams?.status) ? resolvedSearchParams.status : "paid";

  const [orders, entitlements, plans, users, prompts] = await Promise.all([
    fetchAdminPayments(token, { status, limit: "100" }).catch(() => null),
    fetchAdminEntitlements(token).catch(() => null),
    fetchAdminPlans(token).catch(() => ({ data: [] })),
    fetchAdminUsers(token, { limit: "100", sortBy: "createdAt", sortOrder: "desc" }).catch(() => ({ data: [] })),
    fetchAdminPrompts(token, { limit: "100", status: "published" }).catch(() => ({ data: [] }))
  ]);

  return (
    <div className="stack">
      <form className="admin-toolbar" method="get">
        <select aria-label="Payment status" defaultValue={status} name="status">
          <option value="all">All payment statuses</option>
          <option value="created">Created</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="button" type="submit">
          Filter
        </button>
      </form>
      {orders ? <PaymentWebsiteSummary summary={orders.summary || []} /> : <p className="form-error">Unable to load payments.</p>}
      <AdminPaymentsManager
        entitlements={entitlements?.data ?? null}
        orders={orders?.data ?? null}
        plans={plans.data || []}
        prompts={prompts.data || []}
        users={users.data || []}
      />
    </div>
  );
}
