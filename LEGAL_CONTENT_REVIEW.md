# Legal Content Review - October 11, 2026

This internal note records the operational and business items that were not published as customer-facing policy text.

## Implemented

- Removed public launch checklists and implementation notes from `/privacy-policy`, `/terms-of-use`, `/refund-policy`, `/shipping-policy`, and `/contact`.
- Aligned the public operator name to `Sey Ventures Pvt Ltd` based on the supplied task brief.
- Kept `hello@seyprompt.com` as the published support and customer-care contact.
- Reflected fixed-duration manual all-access plans, single-prompt unlocks, credits, Razorpay payments, analytics providers, Cloudinary media handling, support submissions, and account/authentication data based on the frontend and backend implementation.

## Missing Verified Business Information

- Registered/business address.
- Registration number, if SeyPrompt intends to publish one.
- Appointed grievance officer name.
- Grievance officer designation.
- Dedicated grievance officer contact details, if different from `hello@seyprompt.com`.
- Confirmed operational owner for acknowledging grievances within 48 hours and redressing them within one month.
- Approved customer-facing refund decision rules for each digital product scenario below.
- Consent-management decision for optional analytics in markets where opt-in consent is required. The site currently relies on browser controls and disables PostHog session recording.

## Proposed Refund Decision Table For Approval

| Scenario | Proposed customer position | Access or credit effect |
| --- | --- | --- |
| Duplicate successful charges | Refund the duplicate charge after matching the account, product, amount, and payment references. | Keep access or credits for the valid purchase only. |
| Successful payment with undelivered access | Restore the purchased access or credits first where possible; refund if delivery cannot be resolved. | Deliver missing access or reverse only the unresolved purchase. |
| Incorrect charges | Refund or adjust the incorrect amount after verification. | Preserve correctly paid purchases; adjust only the affected order. |
| Defective or materially misdescribed digital products | Refund or replace after review where the product materially differs from the description or cannot be used as described. | Revoke or replace the affected prompt or plan access. |
| Change-of-mind after a prompt is unlocked | Usually non-refundable after unlock, subject to mandatory consumer remedies and support discretion. | Keep access unless a refund is approved. |
| Unused purchased credits | Refundable within an approved request window if no credits from the pack have been used. | Reverse the unused credit pack. |
| Partially used credit packs | Refund only the unused portion where technically and operationally practical, or deny where partial refund support is not approved. | Reverse the refunded credit balance only. |
| Used credits | Usually non-refundable after a prompt is unlocked with credits, subject to mandatory consumer remedies. | Revoke related access only if a refund is approved. |
| Unused all-access plans | Approve within an approved request window if no premium access has been used after purchase. | Revoke the plan entitlement. |
| Partially used all-access plans | Decide whether pro-rata refunds are allowed; avoid promising this publicly until approved. | Revoke plan access if refunded. |
| Promotional credits and gifts | Non-cash and non-refundable unless required by law or a campaign-specific term says otherwise. | Remove promotional balance or gift access if reversed. |

## Legal And Operational Review Gaps

- Counsel should review the final public wording before treating it as legal advice or regulatory sign-off.
- The business should confirm whether a site-level analytics consent mechanism is required for target markets before optional analytics runs.
- Support operations should be prepared to meet the published 48-hour grievance acknowledgement and one-month redress targets.
- If invoices or self-service receipt downloads are later added, update the delivery policy and account/order copy.
