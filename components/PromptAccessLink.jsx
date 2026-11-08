"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/utils/api";
import { useUserAuth } from "@/components/user-auth-provider";

function loginHrefForPrompt(href) {
  const target = typeof href === "string" ? href : href?.pathname || "/prompts";

  return "/login?redirect=" + encodeURIComponent(target);
}

export function PromptAccessLink({ href, onClick, children, ...props }) {
  const router = useRouter();
  const auth = useUserAuth();

  function recordClick() {
    if (!auth.isAuthenticated || window.navigator.doNotTrack === "1") {
      return;
    }

    const pathname = typeof href === "string" ? href : href?.pathname;
    const slug = /^\/prompts\/([a-z0-9-]+)$/.exec(pathname)?.[1];
    if (!slug) {
      return;
    }

    void fetch(apiUrl(`/api/user/prompt-clicks/${slug}`), {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      keepalive: true,
    }).catch(() => {
      // Click tracking must never interrupt navigation.
    });
  }

  function handleClick(event) {
    if (onClick) {
      onClick(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    if (auth.isAuthenticated) {
      recordClick();
      return;
    }

    event.preventDefault();
    router.push(loginHrefForPrompt(href));
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      onAuxClick={(event) => {
        props.onAuxClick?.(event);
        if (event.button === 1 && !event.defaultPrevented) recordClick();
      }}
    >
      {children}
    </Link>
  );
}
