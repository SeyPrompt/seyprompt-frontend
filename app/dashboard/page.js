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
    <main className="section dashboard-section">
      <div className="container dashboard-container">
        <UserDashboard />
      </div>
    </main>
  );
}
