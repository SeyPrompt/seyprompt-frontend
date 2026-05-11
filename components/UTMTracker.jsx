"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { captureUTMParams } from "@/utils/utm";

export function UTMTracker() {
  useEffect(() => {
    const capturedUTM = captureUTMParams();

    if (!capturedUTM) {
      return;
    }

    trackEvent("utm_visit", {
      source: capturedUTM.utm_source,
      medium: capturedUTM.utm_medium,
      campaign: capturedUTM.utm_campaign,
      content: capturedUTM.utm_content,
      term: capturedUTM.utm_term
    });
  }, []);

  return null;
}
