"use client";

import { FilePlus2, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/prompts", label: "Prompts", icon: Library },
  { href: "/admin/prompts/new", label: "Add Prompt", icon: FilePlus2 }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
          >
            <Icon aria-hidden="true" size={17} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
