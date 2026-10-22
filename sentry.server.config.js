import * as Sentry from "@sentry/nextjs";

const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.05");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment:
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development",
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
  sendDefaultPii: false,
  beforeSend(event) {
    event.user = event.user?.id ? { id: event.user.id } : undefined;
    event.breadcrumbs = undefined;
    event.extra = undefined;
    if (event.request?.url) event.request.url = event.request.url.split("?")[0];
    if (event.request) event.request.query_string = undefined;
    if (event.request) {
      event.request.cookies = undefined;
      event.request.headers = undefined;
      event.request.data = undefined;
    }
    return event;
  },
});
