import { LoginForm } from "@/components/user-auth-forms";

export const metadata = {
  title: "User Login",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function LoginPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <div className="stack auth-page-heading">
          <div className="eyebrow">SeyPrompt account</div>
          <h1 className="page-title">Log in</h1>
          <p className="page-subtitle">
            Access your saved prompts and account details.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
