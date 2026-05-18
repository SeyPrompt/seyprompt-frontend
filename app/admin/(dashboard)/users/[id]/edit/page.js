import { notFound } from "next/navigation";
import { AdminUserForm } from "@/components/admin-user-form";
import { fetchAdminUserById } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";

export const metadata = {
  title: "Edit User",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function EditUserPage({ params }) {
  const token = await requireAdminToken();
  const { id } = await params;
  const user = await fetchAdminUserById(token, id).catch(() => null);

  if (!user) {
    notFound();
  }

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Edit</div>
        <h2>{user.name || user.email || "User"}</h2>
        <p className="muted">Update profile, access, verification, or reset the password.</p>
      </div>
      <AdminUserForm mode="edit" user={user} />
    </div>
  );
}
