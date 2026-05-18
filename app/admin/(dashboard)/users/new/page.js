import { AdminUserForm } from "@/components/admin-user-form";

export const metadata = {
  title: "Create User",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function NewUserPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Create</div>
        <h2>New user</h2>
        <p className="muted">
          Add a user with role, membership, account status, and verification controls.
        </p>
      </div>
      <AdminUserForm mode="create" />
    </div>
  );
}
