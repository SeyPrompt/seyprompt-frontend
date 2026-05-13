"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export function TrackedLink({ eventName = "cta_click", eventParams = {}, onClick, ...props }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent(eventName, eventParams);
        onClick?.(event);
      }}
    />
  );
}
