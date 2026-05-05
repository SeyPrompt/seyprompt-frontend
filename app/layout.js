import "./globals.css";
import { Footer } from "@/components/Footer";
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
          <Footer />
        </div>
      </body>
    </html>
  );
}
