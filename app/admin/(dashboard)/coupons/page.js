import { AdminCouponManager } from "@/components/admin-payment-management";
import { fetchAdminCoupons } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";

export const metadata = {
  title: "Admin Coupons",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function AdminCouponsPage() {
  const token = await requireAdminToken();
  const response = await fetchAdminCoupons(token).catch(() => ({
    data: []
  }));

  return (
    <div className="stack">
      <div>
        <h2>Coupons</h2>
        <p className="muted">Manage discounts for single prompt purchases and premium plans.</p>
      </div>
      <AdminCouponManager initialCoupons={response.data || []} />
    </div>
  );
}
