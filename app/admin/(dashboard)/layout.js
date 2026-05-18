import { LogoutButton } from "@/components/logout-button";
import AdminTabs from "@/components/admin-tabs";
import { requireAdminToken } from "@/lib/auth";
import { fetchCurrentAdmin } from "@/lib/api";
import { appVersionLabel } from "@/lib/app-version";
import { redirect } from "next/navigation";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function AdminDashboardLayout({ children }) {
  const token = await requireAdminToken();
  const currentUser = await fetchCurrentAdmin(token).catch(() => null);

  if (!currentUser) {
    redirect("/admin/login");
  }

  return (
    <main className="admin-shell">
      <div className="admin-bar">
        <div className="admin-session">
          <p className="admin-user">
            {currentUser?.user?.email || "Authenticated admin"}
          </p>
          <p className="admin-version">{appVersionLabel}</p>
        </div>
        <LogoutButton />
      </div>
      <section className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Admin</h1>
            <p className="muted">Manage prompts, users, and library controls.</p>
          </div>
          <AdminTabs />
        </div>
        {children}
      </section>
    </main>
  );
}
