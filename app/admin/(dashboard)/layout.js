import { AdminNav } from "@/components/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { requireAdminToken } from "@/lib/auth";
import { fetchCurrentAdmin } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({ children }) {
  const token = await requireAdminToken();
  const currentUser = await fetchCurrentAdmin(token).catch(() => null);

  if (!currentUser) {
    redirect("/admin/login");
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img
            alt="SeyPrompt logo"
            className="navbar-logo-image"
            src="/images/seyprompt-logo.png"
          />
          <strong>SeyPrompt</strong>
        </div>
        <p className="admin-user">
          {currentUser?.user?.email || "Authenticated admin"}
        </p>
        <AdminNav />
        <div className="admin-logout">
          <LogoutButton />
        </div>
      </aside>
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
