"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAuth } from "@/components/user-auth-provider";

export function PromptLoginGate() {
  const auth = useUserAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!auth.ready || auth.isAuthenticated) {
      return;
    }

    router.replace(`/login?redirect=${encodeURIComponent(pathname || "/prompts")}`);
  }, [auth.ready, auth.isAuthenticated, pathname, router]);

  return null;
}
