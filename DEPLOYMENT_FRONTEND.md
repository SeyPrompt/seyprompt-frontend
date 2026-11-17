# SeyPrompt Frontend Deployment

## Render web service

- Connect the GitHub repo and deploy the `main` branch.
- Use the Node.js runtime.
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start -- --hostname 0.0.0.0`
- Configure `seyprompt.com` and `www.seyprompt.com` as custom domains.

## Environment variables

```env
NEXT_PUBLIC_API_URL=https://api.seyprompt.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
PRICING_PROXY_SECRET=
LOGIN_METADATA_PROXY_SECRET=
```

Set `PRICING_PROXY_SECRET` to the same server-only value on the frontend and backend. The frontend resolves the visitor’s country locally using the `CF-Connecting-IP` header supplied by Render’s public ingress and signs it for the backend. Route public traffic through Render’s public endpoint. The regional pricing context at `/api/regional/payments/pricing/context` should report `IN` for visitors whose IP resolves to India.

Set an optional shared `LOGIN_METADATA_PROXY_SECRET` on both services to use a separate signing key for login metadata. Leave it unset on both to use the pricing proxy key.

## Monitoring and analytics

Use Render deploy and runtime logs for server-side errors. PostHog initializes at the app root with autocapture and session replay disabled. Page views are captured manually as `page_viewed`. Authenticated users are identified using the backend-provided hashed user ID and reset on logout.
