import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "SeyPrompt",
    template: "%s | SeyPrompt"
  },
  manifest: "/site.webmanifest",
  description:
    "A searchable prompt library with a private admin panel built for SSR and SEO.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
