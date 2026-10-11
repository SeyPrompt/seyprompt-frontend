import { AdminPlanManager } from "@/components/admin-payment-management";
import { fetchAdminPlans } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";

export const metadata = {
  title: "Admin Plans",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function AdminPlansPage() {
  const token = await requireAdminToken();
  const response = await fetchAdminPlans(token).catch(() => ({
    data: []
  }));

  return (
    <div className="stack">
      <div>
        <h2>Plans</h2>
        <p className="muted">Create premium plans that unlock every paid prompt.</p>
      </div>
      <AdminPlanManager initialPlans={response.data || []} />
    </div>
  );
}
