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
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack">
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
