import { UserDashboard } from "@/components/user-dashboard";

export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function DashboardPage() {
  return (
    <main className="section login-section">
      <div className="container login-container">
        <UserDashboard />
      </div>
    </main>
  );
}
