"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/prompts", label: "Prompt Library" },
  { href: "/ai-prompt-guide", label: "AI Prompt Guide" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container site-nav">
        <Link className="brand" href="/">
          <Image
            alt="SeyPrompt logo"
            className="navbar-logo-image"
            height={42}
            src="/images/seyprompt-logo.png"
            width={135}
          />
          SeyPrompt
        </Link>
        <nav className="nav-links">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                className={`nav-link${active ? " active" : ""}`}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
