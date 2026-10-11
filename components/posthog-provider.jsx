"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function isAnalyticsAllowed() {
  if (typeof window === "undefined") return false;
  return window.navigator?.doNotTrack !== "1";
}

function PostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return;

    const query = searchParams?.toString();
    posthog.capture("page_viewed", {
      path: pathname,
      url: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export function SeyPromptPostHogProvider({ children }) {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

    if (!token || posthog.__loaded || !isAnalyticsAllowed()) {
      return;
    }

    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      loaded: (client) => {
        client.register({
          app: "seyprompt-frontend",
          environment:
            process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
            process.env.NODE_ENV ||
            "development",
          release: process.env.NEXT_PUBLIC_APP_VERSION || "",
        });
      },
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViews />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
