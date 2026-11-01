"use client";

import {
  BookmarkCheck,
  ChevronDown,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryImage } from "@/lib/discovery-categories";
import { useUserAuth } from "@/components/user-auth-provider";

const primaryLinks = [
  { href: "/", label: "Discover" },
  { href: "/prompts", label: "Prompts" },
];
const moreLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/ai-tools", label: "Tools" },
  { href: "/ai-prompt-guide", label: "User Guide" },
  { href: "/use-cases", label: "Use Cases" },
];
const mobileLinks = [{ href: "/collections", label: "Collections" }];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function AccountAvatar({ initial, src }) {
  return (
    <span className="navbar-account-avatar" aria-hidden="true">
      {src ? (
        <img alt="" referrerPolicy="no-referrer" src={src} />
      ) : (
        initial
      )}
    </span>
  );
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
        href="/dashboard"
        onClick={closeMenu}
        role="menuitem"
      >
        <LayoutDashboard aria-hidden="true" size={16} />
        Dashboard
      </Link>
      <Link
        className="navbar-user-dropdown-item"
        href="/saved"
        onClick={closeMenu}
        role="menuitem"
      >
        <BookmarkCheck aria-hidden="true" size={16} />
        Saved Prompts
      </Link>
      <Link
        className="navbar-user-dropdown-item"
        href="/unlocked-prompts"
        onClick={closeMenu}
        role="menuitem"
      >
        <Library aria-hidden="true" size={16} />
        Unlocked Prompts
      </Link>
      <Link
        className="navbar-user-dropdown-item"
        href="/orders"
        onClick={closeMenu}
        role="menuitem"
      >
        <ReceiptText aria-hidden="true" size={16} />
        Orders
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

export function Navbar({ categories = [] }) {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const auth = useUserAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [resourceMenuOpen, setResourceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdminPath = pathname.startsWith("/admin");
  const moreActive = moreLinks.some((link) => isActive(pathname, link.href));
  const accountName = auth.user?.name?.trim() || auth.user?.email?.trim() || "Account";
  const accountInitial = accountName.slice(0, 1).toUpperCase();
  const accountAvatarUrl = auth.user?.avatarUrl || "";

  function closeMenu() {
    setSearchOpen(false);
    setOpen(false);
    setCategoryMenuOpen(false);
    setResourceMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    const dismiss = event => { if (event.key === "Escape" || (event.type === "pointerdown" && !headerRef.current?.contains(event.target))) closeMenu(); };
    document.addEventListener("keydown", dismiss); document.addEventListener("pointerdown", dismiss);
    return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", dismiss); };
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="navbar discover-navbar" ref={headerRef}>
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
              aria-expanded={categoryMenuOpen}
              aria-controls="navbar-category-menu"
              className={`nav-link navbar-more-button${categoryMenuOpen ? " active" : ""}`}
              onClick={() => {
                setCategoryMenuOpen((current) => !current);
                setResourceMenuOpen(false);
                setUserMenuOpen(false);
              }}
              type="button"
            >
              Categories
              <ChevronDown aria-hidden="true" size={15} />
            </button>
            <div id="navbar-category-menu" className={`navbar-more-dropdown${categoryMenuOpen ? " open" : ""}`}>
              <div className="navbar-category-grid">
                {categories.map(category => <Link className="navbar-category-link" href={`/?category=${encodeURIComponent(category.slug)}`} key={category.slug} onClick={closeMenu}><img src={categoryImage(category)} alt="" loading="lazy" /><span>{category.name}</span></Link>)}
              </div>
            </div>
          </div>
          <Link className={`nav-link${isActive(pathname, "/collections") ? " active" : ""}`} href="/collections" onClick={closeMenu}>Collections</Link>
          <div className="navbar-more-menu">
            <button className={`nav-link navbar-more-button${moreActive || resourceMenuOpen ? " active" : ""}`} type="button" aria-expanded={resourceMenuOpen} aria-controls="navbar-more-links" onClick={() => { setResourceMenuOpen(current => !current); setCategoryMenuOpen(false); setUserMenuOpen(false); }}>
              More <ChevronDown aria-hidden="true" size={15} />
            </button>
            <div id="navbar-more-links" className={`navbar-resource-dropdown${resourceMenuOpen ? " open" : ""}`}>
              {moreLinks.map(link => <Link className="navbar-user-dropdown-item" href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}
            </div>
          </div>
          <form className="navbar-discover-search" action="/" role="search"><Search size={16} aria-hidden="true" /><label className="visually-hidden" htmlFor="navbar-search">Search prompts</label><input id="navbar-search" name="q" type="search" maxLength={200} placeholder="Search prompts…" /></form>
          {!isAdminPath ? (
            auth.isAuthenticated ? (
              <div className="navbar-user-menu">
                <button
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  className={`navbar-account-button${userMenuOpen || isActive(pathname, "/dashboard") || isActive(pathname, "/saved") || isActive(pathname, "/unlocked-prompts") || isActive(pathname, "/orders") ? " active" : ""}`}
                  onClick={() => {
                    setUserMenuOpen((current) => !current);
                    setCategoryMenuOpen(false);
                    setResourceMenuOpen(false);
                  }}
                  type="button"
                >
                  <AccountAvatar initial={accountInitial} src={accountAvatarUrl} />
                  <span className="navbar-account-label">Account</span>
                  <ChevronDown aria-hidden="true" size={15} />
                </button>
                <div className={`navbar-user-dropdown${userMenuOpen ? " open" : ""}`} role="menu">
                  <AccountDropdownContent auth={auth} closeMenu={closeMenu} />
                </div>
              </div>
            ) : (
              <><Link
                className={`login-button navbar-login-button${isActive(pathname, "/login") ? " active" : ""}`}
                href="/login" onClick={closeMenu}>Login</Link><Link className="navbar-create-account" href="/register" onClick={closeMenu}>Get Started</Link></>
            )
          ) : null}
        </nav>
        <button type="button" className="navbar-icon-button navbar-search-toggle" aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen} aria-controls="navbar-search-panel" onClick={() => { setSearchOpen(current => !current); setOpen(false); setCategoryMenuOpen(false); setResourceMenuOpen(false); setUserMenuOpen(false); }}><Search size={20} aria-hidden="true" /></button>
        <button
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="navbar-toggle"
          onClick={() => {
            setOpen((current) => !current);
            setCategoryMenuOpen(false);
            setResourceMenuOpen(false);
            setSearchOpen(false);
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

      <div id="navbar-search-panel" className="navbar-search-panel" hidden={!searchOpen}>
        <form className="container navbar-compact-search" action="/" role="search"><label className="visually-hidden" htmlFor="compact-navbar-search">Search prompts</label><input ref={searchInputRef} id="compact-navbar-search" name="q" type="search" maxLength={200} placeholder="Search prompts, categories, or use cases…" /><button type="submit" onClick={closeMenu}>Search</button></form>
      </div>
      <div id="mobile-navigation" hidden={!open} className={`navbar-mobile-menu${open ? " open" : ""}`}>
        <nav
          className="container navbar-mobile-links"
          aria-label="Mobile navigation"
        >
          {primaryLinks.map((link) => (
            <Link
              className={`mobile-nav-link${isActive(pathname, link.href) ? " active" : ""}`}
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <details className="navbar-mobile-categories"><summary>Categories <ChevronDown size={16} /></summary>{categories.map(category => <Link href={`/?category=${encodeURIComponent(category.slug)}`} key={category.slug} onClick={closeMenu}>{category.name}</Link>)}</details>
          {mobileLinks.map(link => <Link className="mobile-nav-link" href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}
          <details className="navbar-mobile-categories"><summary>More <ChevronDown size={16} /></summary>{moreLinks.map(link => <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}</details>

          {!isAdminPath ? (
            auth.isAuthenticated ? (
              <>
                <Link
                  className={`mobile-nav-link${isActive(pathname, "/dashboard") ? " active" : ""}`}
                  href="/dashboard"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link
                  className={`mobile-nav-link${isActive(pathname, "/saved") ? " active" : ""}`}
                  href="/saved"
                  onClick={closeMenu}
                >
                  Saved Prompts
                </Link>
                <Link
                  className={`mobile-nav-link${isActive(pathname, "/unlocked-prompts") ? " active" : ""}`}
                  href="/unlocked-prompts"
                  onClick={closeMenu}
                >
                  Unlocked Prompts
                </Link>
                <Link
                  className={`mobile-nav-link${isActive(pathname, "/orders") ? " active" : ""}`}
                  href="/orders"
                  onClick={closeMenu}
                >
                  Orders
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
              <>
              <Link
                className={`mobile-nav-link mobile-login-link${isActive(pathname, "/login") ? " active" : ""}`}
                href="/login"
                onClick={closeMenu}
              >
                Login
              </Link>
              <Link className="mobile-nav-link mobile-get-started" href="/register" onClick={closeMenu}>Get Started</Link>
              </>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
