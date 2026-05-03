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
        <div className="eyebrow">Admin panel</div>
        <h2 style={{ marginTop: 10 }}>SeyPrompt CMS</h2>
        <p className="muted">
          {currentUser?.user?.email || "Authenticated admin"}
        </p>
        <AdminNav />
      </aside>
      <section className="admin-main">
        <div className="admin-header">
          <div>
            <div className="eyebrow">Protected workspace</div>
            <h1 style={{ margin: "10px 0 0" }}>Prompt management</h1>
          </div>
          <LogoutButton />
        </div>
        {children}
      </section>
    </main>
  );
}
