import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminToken } from "@/lib/auth";
import { fetchCurrentAdmin } from "@/lib/api";

export const metadata = {
  title: "Admin Login"
};

export default async function AdminLoginPage() {
  const token = await getAdminToken();

  if (token) {
    const currentUser = await fetchCurrentAdmin(token).catch(() => null);

    if (currentUser) {
      redirect("/admin/prompts");
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="stack" style={{ marginBottom: 18 }}>
          <div className="eyebrow">Admin access</div>
          <h1 className="page-title">Sign in to manage prompts</h1>
          <p className="page-subtitle">
            This login writes the backend JWT into a secure cookie so admin pages can
            render server-side.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
