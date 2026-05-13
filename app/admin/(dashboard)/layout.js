import { LogoutButton } from "@/components/logout-button";
import { requireAdminToken } from "@/lib/auth";
import { fetchCurrentAdmin } from "@/lib/api";
import { redirect } from "next/navigation";

export const metadata = {
  robots: {
    index: false,
    follow: false
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
        <p className="admin-user">
          {currentUser?.user?.email || "Authenticated admin"}
        </p>
        <LogoutButton />
      </div>
      <section className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Prompts</h1>
            <p className="muted">Manage all prompts in your library.</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
