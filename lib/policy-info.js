export const POLICY_VERSION = "2026-10-22";
export const POLICY_EFFECTIVE_DATE = "October 11, 2026";
export const POLICY_LAST_UPDATED_DATE = "October 22, 2026";
export const SUPPORT_EMAIL = "hello@seyprompt.com";
export const CUSTOMER_CARE_EMAIL = SUPPORT_EMAIL;
export const LEGAL_OPERATOR_DISPLAY = "Sey Ventures Pvt Ltd";
export const VERIFIED_LEGAL_NAME = "Sey Ventures Pvt Ltd";
export const VERIFIED_BUSINESS_ADDRESS = "";
export const GRIEVANCE_OFFICER = {
  name: "",
  designation: "",
  email: SUPPORT_EMAIL
};

export const policyDateLabel =
  POLICY_EFFECTIVE_DATE === POLICY_LAST_UPDATED_DATE
    ? `Effective: ${POLICY_EFFECTIVE_DATE}`
    : `Effective: ${POLICY_EFFECTIVE_DATE} | Last updated: ${POLICY_LAST_UPDATED_DATE}`;

export const policyLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-use", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund & Cancellation" },
  { href: "/shipping-policy", label: "Shipping & Digital Delivery" },
  { href: "/contact", label: "Contact" }
];
