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

    posthog.capture("page_viewed", {
      path: pathname,
      url: pathname,
      $geoip_disable: true,
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
      ip: false,
      save_referrer: false,
      store_google: false,
      respect_dnt: true,
      property_denylist: ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer", "$ip", "$geoip_city_name", "$geoip_subdivision_1_name", "$geoip_country_code"],
      before_send: (event) => {
        if (event) event.properties.$geoip_disable = true;
        return event;
      },
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
