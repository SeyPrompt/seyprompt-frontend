"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/prompts", label: "Prompt Library" },
  { href: "/ai-prompt-guide", label: "AI Prompt Guide" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand navbar-brand" href="/" onClick={closeMenu}>
          <span className="logo-wrap">
            <img
              alt="SeyPrompt logo"
              className="navbar-logo-image"
              src="/images/seyprompt-logo.png"
            />
          </span>
        </Link>

        <nav className="navbar-desktop-links" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              className={`nav-link${isActive(pathname, link.href) ? " active" : ""}`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="navbar-toggle"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? (
            <X aria-hidden="true" size={22} />
          ) : (
            <Menu aria-hidden="true" size={22} />
          )}
        </button>
      </div>

      <div className={`navbar-mobile-menu${open ? " open" : ""}`}>
        <nav
          className="container navbar-mobile-links"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <Link
              className={`mobile-nav-link${isActive(pathname, link.href) ? " active" : ""}`}
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
