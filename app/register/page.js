import { RegisterForm } from "@/components/user-auth-forms";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Create Account");

export default function RegisterPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">SeyPrompt account</div>
          <h1 className="page-title">Create account</h1>
          <p className="page-subtitle">
            Register with your email, then verify the OTP to finish setup.
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
