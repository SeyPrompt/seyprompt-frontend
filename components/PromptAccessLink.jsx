"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/components/user-auth-provider";

function loginHrefForPrompt(href) {
  const target = typeof href === "string" ? href : href?.pathname || "/prompts";

  return "/login?redirect=" + encodeURIComponent(target);
}

export function PromptAccessLink({ href, onClick, children, ...props }) {
  const router = useRouter();
  const auth = useUserAuth();

  function handleClick(event) {
    if (onClick) {
      onClick(event);
    }

    if (event.defaultPrevented || auth.isAuthenticated) {
      return;
    }

    event.preventDefault();
    router.push(loginHrefForPrompt(href));
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
