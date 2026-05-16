"use client";

import {
  BookmarkCheck,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUserAuth } from "@/components/user-auth-provider";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/prompts", label: "Prompts" },
  { href: "/ai-prompt-guide", label: "Guide" },
  { href: "/ai-tools", label: "Tools" },
  { href: "/use-cases", label: "Use Cases" },
];

const moreLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const mobileLinks = [...primaryLinks, ...moreLinks];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function AccountDropdownContent({ auth, closeMenu }) {
  const name = auth.user?.name?.trim();
  const email = auth.user?.email?.trim();

  return (
    <>
      <div className="navbar-account-summary">
        {name ? <div className="navbar-account-name">{name}</div> : null}
        {email ? <div className="navbar-account-email">{email}</div> : null}
      </div>
      <Link
        className="navbar-user-dropdown-item"
        href="/saved"
        onClick={closeMenu}
        role="menuitem"
      >
        <BookmarkCheck aria-hidden="true" size={16} />
        Saved Prompts
      </Link>
      <button
        className="navbar-user-dropdown-item"
        onClick={() => {
          closeMenu();
          auth.logout();
        }}
        role="menuitem"
        type="button"
      >
        <LogOut aria-hidden="true" size={16} />
        Logout
      </button>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const auth = useUserAuth();
  const [open, setOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdminPath = pathname.startsWith("/admin");
  const moreActive = moreLinks.some((link) => isActive(pathname, link.href));

  function closeMenu() {
    setOpen(false);
    setMoreMenuOpen(false);
    setUserMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand navbar-brand" href="/" onClick={closeMenu}>
          <span className="logo-wrap">
            <Image
              alt="SeyPrompt logo"
              className="navbar-logo-image"
              height={42}
              priority
              src="/images/seyprompt-logo.png"
              width={135}
            />
          </span>
        </Link>

        <nav className="navbar-desktop-links" aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <Link
              className={`nav-link${isActive(pathname, link.href) ? " active" : ""}`}
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <div className="navbar-more-menu">
            <button
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              className={`nav-link navbar-more-button${moreActive || moreMenuOpen ? " active" : ""}`}
              onClick={() => {
                setMoreMenuOpen((current) => !current);
                setUserMenuOpen(false);
              }}
              type="button"
            >
              More
              <ChevronDown aria-hidden="true" size={15} />
            </button>
            <div className={`navbar-more-dropdown${moreMenuOpen ? " open" : ""}`} role="menu">
              {moreLinks.map((link) => (
                <Link
                  className="navbar-user-dropdown-item"
                  href={link.href}
                  key={link.href}
                  onClick={closeMenu}
                  role="menuitem"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {!isAdminPath ? (
            auth.isAuthenticated ? (
              <div className="navbar-user-menu">
                <button
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  className={`navbar-icon-button${userMenuOpen ? " active" : ""}`}
                  onClick={() => {
                    setUserMenuOpen((current) => !current);
                    setMoreMenuOpen(false);
                  }}
                  type="button"
                >
                  <User aria-hidden="true" size={18} />
                </button>
                <div className={`navbar-user-dropdown${userMenuOpen ? " open" : ""}`} role="menu">
                  <AccountDropdownContent auth={auth} closeMenu={closeMenu} />
                </div>
              </div>
            ) : (
              <Link
                aria-label="Login"
                className={`login-button login-icon-button${isActive(pathname, "/login") ? " active" : ""}`}
                href="/login"
                onClick={closeMenu}
                title="Login"
              >
                <LogIn aria-hidden="true" size={18} />
              </Link>
            )
          ) : null}
        </nav>
        {!isAdminPath && auth.isAuthenticated ? (
          <div className="navbar-user-menu navbar-mobile-user-trigger">
            <button
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Open account menu"
              className={`navbar-icon-button${userMenuOpen ? " active" : ""}`}
              onClick={() => {
                setUserMenuOpen((current) => !current);
                setMoreMenuOpen(false);
              }}
              type="button"
            >
              <User aria-hidden="true" size={18} />
            </button>
            <div className={`navbar-user-dropdown${userMenuOpen ? " open" : ""}`} role="menu">
              <AccountDropdownContent auth={auth} closeMenu={closeMenu} />
            </div>
          </div>
        ) : null}
        <button
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="navbar-toggle"
          onClick={() => {
            setOpen((current) => !current);
            setMoreMenuOpen(false);
            setUserMenuOpen(false);
          }}
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
          {mobileLinks.map((link) => (
            <Link
              className={`mobile-nav-link${isActive(pathname, link.href) ? " active" : ""}`}
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          {!isAdminPath ? (
            auth.isAuthenticated ? (
              <>
                <Link
                  className={`mobile-nav-link${isActive(pathname, "/saved") ? " active" : ""}`}
                  href="/saved"
                  onClick={closeMenu}
                >
                  Saved Prompts
                </Link>
                <button
                  className="mobile-nav-link mobile-logout-button"
                  onClick={() => {
                    closeMenu();
                    auth.logout();
                  }}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className={`mobile-nav-link mobile-login-link${isActive(pathname, "/login") ? " active" : ""}`}
                href="/login"
                onClick={closeMenu}
              >
                Login
              </Link>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
