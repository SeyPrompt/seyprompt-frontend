"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/prompts", label: "All Prompts" },
  { href: "/admin/prompts/new", label: "Create Prompt" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
