'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      <Link
        className={`button-secondary compact${isActive(pathname, "/admin/prompts") ? " active" : ""}`}
        href="/admin/prompts"
      >
        Prompts
      </Link>
      <Link
        className={`button-secondary compact${isActive(pathname, "/admin/users") ? " active" : ""}`}
        href="/admin/users"
      >
        Users
      </Link>
    </nav>
  );
}
