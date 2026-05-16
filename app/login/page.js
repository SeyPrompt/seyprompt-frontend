import { LoginForm } from "@/components/user-auth-forms";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Login",
  description: "Log in to your SeyPrompt account.",
  path: "/login"
});

export default function LoginPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">User login</div>
          <h1 className="page-title">Welcome back</h1>
          <p className="page-subtitle">
            Log in with your verified email and password.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
