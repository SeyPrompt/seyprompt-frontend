import * as Sentry from "@sentry/nextjs";

const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0.05");

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development",
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
  beforeSend(event) {
    if (event.request) {
      event.request.cookies = undefined;
      event.request.headers = undefined;
      event.request.data = undefined;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
