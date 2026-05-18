"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useUserAuth } from "@/components/user-auth-provider";

export function UserDashboard() {
  const router = useRouter();
  const auth = useUserAuth();

  useEffect(() => {
    if (auth.ready && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isAuthenticated, auth.ready, router]);

  if (!auth.ready) {
    return (
      <div className="panel form-card">
        <p className="muted">Loading your account...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="panel form-card stack dashboard-panel">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="page-title">Welcome, {auth.user.name}</h1>
        <p className="page-subtitle">{auth.user.email}</p>
      </div>
      <dl className="auth-user-details">
        <div>
          <dt>Membership</dt>
          <dd>{auth.user.membershipType}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{auth.user.isEmailVerified ? "Verified" : "Not verified"}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{auth.user.role}</dd>
        </div>
      </dl>
      <div className="auth-actions">
        <Link className="button-secondary" href="/prompts">
          Browse prompts
        </Link>
        <button className="button-danger" onClick={auth.logout} type="button">
          <LogOut aria-hidden="true" size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
