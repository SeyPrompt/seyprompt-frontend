import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "SeyPrompt",
    template: "%s | SeyPrompt"
  },
  description:
    "A searchable prompt library with a private admin panel built for SSR and SEO."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <SiteHeader />
          {children}
          <footer className="footer">
            <div className="container">
              SeyPrompt combines a public prompt catalog with an admin workflow in a
              single SSR-first app.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
