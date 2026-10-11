# Legal Content Review - October 12, 2026

This internal note records operational and business items that were not published as customer-facing policy text.

## Implemented

- Removed public launch checklists, summary cards, and implementation notes from `/privacy-policy`, `/terms-of-use`, `/refund-policy`, `/shipping-policy`, and `/contact`.
- Aligned the public operator name to `Sey Ventures Pvt Ltd` based on the supplied task brief.
- Kept `hello@seyprompt.com` as the published support and customer-care contact.
- Reflected fixed-duration manual all-access plans, single-prompt unlocks, credits, Razorpay payments, analytics providers, Cloudinary media handling, support submissions, and account/authentication data based on the frontend and backend implementation.
- Verified all-access entitlements start when payment is confirmed and expire after the purchased duration; they do not extend from the end of an existing entitlement.
- Verified the dashboard disables another all-access purchase while all-access is active.
- Verified local production-style env values for Google Analytics, PostHog, and Sentry are unset. Code supports Google Analytics, PostHog, Vercel Analytics, Vercel Speed Insights, and Sentry when configured.

## Missing Verified Business Information

- Registered/business address.
- Registration number, if SeyPrompt intends to publish one.
- Appointed grievance officer name.
- Grievance officer designation.
- Dedicated grievance officer contact details, if different from `hello@seyprompt.com`.
- Confirmed operational owner for acknowledging grievances within 48 hours and redressing them within one month.
- Consent-management decision for optional analytics in markets where opt-in consent is required. The site currently relies on browser controls and disables PostHog session recording.

## Refund Decisions Still Needed

| Scenario | Decision needed |
| --- | --- |
| Change-of-mind after a prompt is unlocked | Approve whether these are always denied, case-by-case, or allowed within a request window. |
| Unused purchased credits | Approve whether fully unused credit packs are refundable and the request window, if any. |
| Partially used credit packs | Approve whether unused balances can be partially refunded, credited, or denied. |
| Used credits | Approve whether used credit unlocks are refundable only for defects/misdescription or also for other cases. |
| Unused all-access plans | Approve whether unused plans can be refunded and the request window, if any. |
| Partially used all-access plans | Approve whether pro-rata refunds are offered or denied after plan access begins. |
| Promotional credits and gifts | Approve whether any campaign-specific exceptions exist beyond no cash value. |
| Refund initiation SLA | Public copy now says SeyPrompt aims to initiate approved refunds within 7 business days. Confirm this operational SLA. |

## Legal And Operational Review Gaps

- Counsel should review the final public wording before treating it as legal advice or regulatory sign-off.
- The business should confirm whether a site-level analytics consent mechanism is required for target markets before optional analytics runs.
- Support operations should be prepared to meet the published 48-hour grievance acknowledgement and one-month redress targets.
- If invoices or self-service receipt downloads are later added, update the delivery policy and account/order copy.
