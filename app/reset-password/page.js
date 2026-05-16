import { ResetPasswordForm } from "@/components/user-auth-forms";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reset Password",
  description: "Reset your SeyPrompt password with a 6-digit OTP.",
  path: "/reset-password"
});

export default function ResetPasswordPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">New password</div>
          <h1 className="page-title">Choose a new password</h1>
          <p className="page-subtitle">
            Confirm your OTP and set a new password. You will log in again after reset.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
