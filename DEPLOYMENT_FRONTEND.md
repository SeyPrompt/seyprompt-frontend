# SeyPrompt Frontend Deployment

## Vercel setup

- Import GitHub repo
- Framework: Next.js
- Production branch: main
- Build command: npm run build
- Output: default
- Auto deploy: enabled

## Environment variables

```env
NEXT_PUBLIC_API_URL=https://api.seyprompt.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=seyprompt-frontend
SENTRY_AUTH_TOKEN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0.05
```

## Domain

- seyprompt.com
- www.seyprompt.com

## Monitoring and analytics

Sentry is initialized through Next.js instrumentation files for browser and server-side errors. Keep `NEXT_PUBLIC_SENTRY_DSN` public, but keep `SENTRY_AUTH_TOKEN` private in Vercel for secure source map upload. Source maps are deleted after upload during build.

PostHog initializes once at the app root with autocapture and session replay disabled. Page views are captured manually as `page_viewed`, and existing product events flow through `lib/analytics.js` with sensitive fields removed. Authenticated users are identified only with the backend-provided hashed user ID and reset on logout.

Use a conservative trace sample rate such as `0.05` for both public and server-side Sentry variables. Do not enable Sentry Replay or PostHog session recording until there is a reviewed consent and privacy plan.
