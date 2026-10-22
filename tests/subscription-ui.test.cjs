const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const swc = require('next/dist/build/swc');
async function loadComponent(file, overrides = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { code } = await swc.transform(source, { jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const exports = {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console })(
    (id) => overrides[id] || (id === 'next/link' ? ({ children, href }) => React.createElement('a', { href }, children) : require(id)), { exports }, exports);
  return exports;
}
const plan = { id: 'p', name: 'Starter', durationDays: 100, pricing: { displayPrice: '₹249', currency: 'INR' }, autoPay: { eligible: false, reason: 'Account eligibility not verified.' } };
test('AutoPay defaults unchecked, unavailable intervals stay disabled, and manual explanation and terms render', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const html = renderToStaticMarkup(React.createElement(Options, { plan, enabled: false, onChange() {} }));
  assert.match(html, /disabled=""/); assert.doesNotMatch(html, /checked=""/);
  assert.match(html, /One-time payment/); assert.match(html, /100/); assert.match(html, /Account eligibility/);
  assert.match(html, /href="\/terms-of-use"/); assert.match(html, /href="\/refund-policy"/);
});
test('eligible checkout requires opt-in and shows agreed currency, exact interval and expected renewal date', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const eligiblePlan = { ...plan, autoPay: { eligible: true, interval: 100, currency: 'INR', nextExpectedBillingDate: '2027-02-01' } };
  const manual = renderToStaticMarkup(React.createElement(Options, { plan: eligiblePlan, enabled: false, onChange() {} }));
  const recurring = renderToStaticMarkup(React.createElement(Options, { plan: eligiblePlan, enabled: true, onChange() {} }));
  assert.doesNotMatch(manual, /checked=""/); assert.match(recurring, /checked=""/);
  assert.match(recurring, /every 100 days/); assert.match(recurring, /INR/); assert.match(recurring, /Next expected renewal/);
});
test('an invalidated plan cannot retain a checked AutoPay state', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const html = renderToStaticMarkup(React.createElement(Options, { plan, enabled: true, onChange() {} }));
  assert.doesNotMatch(html, /checked=""/); assert.match(html, /disabled=""/);
});
test('dashboard allows early manual renewal for an active paid plan', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const states = [false, [], false, [plan], [{ status: 'paid' }], [{ id: 'e', type: 'subscription', plan: { name: 'Starter' }, startsAt: '2026-01-01', expiresAt: '2099-01-01', amountPaid: 249, currency: 'INR' }], 'p', false, false, ''];
  let index = 0;
  const Dashboard = (await loadComponent('components/user-dashboard.jsx', {
    react: { ...React, useState: () => [states[index++], () => {}] },
    'next/navigation': { useRouter: () => ({}) },
    '@/components/subscription-renewal-options': { __esModule: true, default: Options },
    '@/components/user-auth-provider': { useUserAuth: () => ({ ready: true, isAuthenticated: true, token: 'mock', user: { name: 'Test' } }) },
    '@/lib/account-access': { buildUnlockedPromptItems: () => [], isActiveEntitlement: () => true },
    '@/lib/analytics': { trackEvent() {} }, '@/lib/policy-info': { POLICY_VERSION: 'test' }, '@/lib/payments': {}
  })).UserDashboard;
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  assert.match(html, /Renew Subscription/);
  const button = html.match(/<button[^>]*class="button dashboard-plan-submit"[^>]*>/)?.[0];
  assert.ok(button); assert.doesNotMatch(button, /disabled/);
  assert.match(html, /remaining paid access/);
});

test('paid order access fallback respects purchased renewal period rather than edited plan duration', async () => {
  const { getOrderAccessExpiry } = await loadComponent('lib/account-access.js');
  const order = { paidAt: '2026-10-22', plan: { durationDays: 1 }, priceSnapshot: { durationDays: 100, periodEnd: '2027-02-09' } };
  assert.equal(getOrderAccessExpiry(order).toISOString(), '2027-02-09T00:00:00.000Z');
});
