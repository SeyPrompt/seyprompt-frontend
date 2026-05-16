import { VerifyEmailForm } from "@/components/user-auth-forms";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Verify Email",
  description: "Verify your SeyPrompt account email with a 6-digit OTP.",
  path: "/verify-email"
});

export default function VerifyEmailPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">Email verification</div>
          <h1 className="page-title">Enter your OTP</h1>
          <p className="page-subtitle">
            Use the 6-digit code sent to your email. Registration completes after verification.
          </p>
        </div>
        <VerifyEmailForm />
      </div>
    </main>
  );
}
