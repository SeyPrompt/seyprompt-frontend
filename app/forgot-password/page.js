import { ForgotPasswordForm } from "@/components/user-auth-forms";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Forgot Password");

export default function ForgotPasswordPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">Password reset</div>
          <h1 className="page-title">Reset your password</h1>
          <p className="page-subtitle">
            Enter your email and we will send a password reset OTP if an account exists.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
