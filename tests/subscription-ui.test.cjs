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
test('unavailable AutoPay shows one-time billing without a dead checkbox or internal setup reasons', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const html = renderToStaticMarkup(React.createElement(Options, { plan, enabled: false, onChange() {} }));
  assert.doesNotMatch(html, /type="checkbox"/); assert.doesNotMatch(html, /checked=""/);
  assert.match(html, /One-time payment/); assert.match(html, /100/); assert.match(html, /No automatic charges/);
  assert.match(html, /href="\/terms-of-use"/); assert.match(html, /href="\/refund-policy"/);
});
test('eligible checkout requires opt-in and shows agreed currency, exact interval and expected renewal date', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const eligiblePlan = { ...plan, autoPay: { eligible: true, interval: 100, currency: 'INR', nextExpectedBillingDate: '2027-02-01' } };
  const manual = renderToStaticMarkup(React.createElement(Options, { plan: eligiblePlan, enabled: false, onChange() {} }));
  const recurring = renderToStaticMarkup(React.createElement(Options, { plan: eligiblePlan, enabled: true, onChange() {} }));
  assert.doesNotMatch(manual, /checked=""|disabled=""/); assert.match(recurring, /checked=""/);
  assert.match(recurring, /every 100 days/); assert.match(recurring, /INR/); assert.match(recurring, /Next expected renewal/);
});
test('an invalidated plan cannot retain a checked AutoPay state', async () => {
  const Options = (await loadComponent('components/subscription-renewal-options.jsx')).default;
  const html = renderToStaticMarkup(React.createElement(Options, { plan, enabled: true, onChange() {} }));
  assert.doesNotMatch(html, /checked=""/); assert.doesNotMatch(html, /type="checkbox"/);
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
  assert.match(html, /Renew access/);
  const button = html.match(/<button[^>]*class="button dashboard-plan-submit"[^>]*>/)?.[0];
  assert.ok(button); assert.doesNotMatch(button, /disabled/);
  assert.match(html, /remaining paid access/);
});

test('paid order access fallback respects purchased renewal period rather than edited plan duration', async () => {
  const { getOrderAccessExpiry } = await loadComponent('lib/account-access.js');
  const order = { paidAt: '2026-10-22', plan: { durationDays: 1 }, priceSnapshot: { durationDays: 100, periodEnd: '2027-02-09' } };
  assert.equal(getOrderAccessExpiry(order).toISOString(), '2027-02-09T00:00:00.000Z');
});

test('regional rows save independent IDs and preserve an explicit manual-only blank', async () => {
  const { buildRegionalPrices } = await loadComponent('lib/recurring-plan-fields.js');
  const rows = [
    { region: 'DEFAULT', currency: 'USD', amount: 5, isActive: true, razorpayPlanId: ' plan_default ' },
    { region: 'US', currency: 'USD', amount: 7, isActive: true, razorpayPlanId: 'plan_us' },
    { region: 'IN', currency: 'INR', amount: 249, isActive: true, razorpayPlanId: '' }
  ];
  const result = buildRegionalPrices(rows);
  assert.equal(result[0].razorpayPlanId, 'plan_default');
  assert.equal(result[1].razorpayPlanId, 'plan_us');
  assert.equal(result[2].razorpayPlanId, '');
  rows[0].razorpayPlanId = 'order_wrong';
  assert.throws(() => buildRegionalPrices(rows), /valid Razorpay plan ID for DEFAULT/);
});

test('legacy mappings migrate only for unambiguous prices and never override an empty regional ID', async () => {
  const { regionalGatewayPlanId } = await loadComponent('lib/recurring-plan-fields.js');
  const india = { region: 'IN', currency: 'INR', amountMinor: 24900 };
  const existing = { regionalPrices: [india], recurringPlans: [{ currency: 'INR', razorpayPlanId: 'plan_saved' }] };
  assert.equal(regionalGatewayPlanId(existing, india), 'plan_saved');
  assert.equal(regionalGatewayPlanId(existing, { ...india, razorpayPlanId: '' }), '');
  existing.regionalPrices.push({ region: 'DEFAULT', currency: 'INR', amountMinor: 35000 });
  assert.equal(regionalGatewayPlanId(existing, india), '');
});

test('admin places gateway fields inside regional prices and removes the separate recurring table', async () => {
  const fields = await loadComponent('lib/recurring-plan-fields.js');
  const rows = [
    { id: 'india', region: 'IN', currency: 'INR', amount: 249, isActive: true, razorpayPlanId: 'plan_savedINR' },
    { id: 'default', region: 'DEFAULT', currency: 'USD', amount: 5, isActive: true, razorpayPlanId: 'plan_savedUSD' }
  ];
  const existing = { id: 'existing', name: 'Starter', slug: 'starter', price: 249, currency: 'INR', durationDays: 100,
    autoPayEnabled: true, regionalPrices: rows };
  const states = [[existing], existing, '', '', rows];
  let index = 0;
  const { AdminPlanManager } = await loadComponent('components/admin-payment-management.js', {
    react: { ...React, useState: () => [states[index++], () => {}] },
    'next/navigation': { useRouter: () => ({}) }, '@/lib/recurring-plan-fields': fields
  });
  const html = renderToStaticMarkup(React.createElement(AdminPlanManager));
  assert.match(html, /aria-label="Regional prices"/);
  assert.match(html, /aria-label="India Razorpay plan ID"/);
  assert.match(html, /aria-label="Default \/ International Razorpay plan ID"/);
  assert.match(html, /name="regionalPlan_india"[^>]*value="plan_savedINR"/);
  assert.match(html, /name="regionalPlan_default"[^>]*value="plan_savedUSD"/);
  assert.doesNotMatch(html, /Recurring plans<|Gateway plans by currency|recurringPlan_INR/);
});
