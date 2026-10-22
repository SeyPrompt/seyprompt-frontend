const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const swc = require('next/dist/build/swc');

async function load(file, mocks = {}) {
  const { code } = await swc.transform(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' }
  });
  const exports = {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {})(
    id => mocks[id] || require(id), { exports }, exports
  );
  return exports;
}

const Null = () => null;
const prompt = { title: 'Test prompt', slug: 'test', pricingType: 'premium', price: 99,
  tips: 'Private tips content', sampleOutput: { type: 'text', value: 'Private sample content' } };

async function unlockMocks(extra = {}) {
  return {
    '@/lib/prompt-pricing': await load('lib/prompt-pricing.js'),
    '@/components/prompt-detail-sections': await load('components/prompt-detail-sections.jsx', {
      '@/components/protected-media': { ProtectedImage: Null, ProtectedVideo: Null, ProtectedMediaFrame: Null }
    }),
    '@/components/CopyButton': { CopyButton: Null },
    '@/components/CopyOpenButton': { CopyOpenButton: Null },
    '@/components/PromptCheckoutModal': { PromptCheckoutModal: Null },
    '@/components/account-access-provider': { useAccountAccess: () => ({ isPromptUnlocked: () => false }) },
    '@/components/user-auth-provider': { useUserAuth: () => ({ ready: true, token: 'test-token' }) },
    '@/lib/payments': { fetchUserPrompt: async () => ({ ...prompt, prompt: 'Purchased prompt' }) },
    ...extra
  };
}

async function renderDetail(pricingType, price = 0, promptText = '') {
  const mocks = await unlockMocks();
  mocks['@/lib/api'] = { fetchPromptBySlug: async () => ({ ...prompt, pricingType, price, prompt: promptText }), fetchPublicPrompts: async () => ({ data: [] }) };
  mocks['@/lib/prompt-metadata'] = { getPromptCategories: () => [], getPrimaryPromptCategory: () => '', getPromptCategoryLabel: () => '' };
  mocks['@/utils/categoryIcons'] = { getCategoryIcon: () => Null };
  mocks['@/lib/seo'] = { absoluteUrl: x => x, breadcrumbSchema: () => ({}), promptSchema: () => ({}), truncateDescription: x => x };
  for (const [file, name] of [['PromptAccessLink', 'PromptAccessLink'], ['PromptLoginGate', 'PromptLoginGate'], ['prompt-detail-price-badge', 'PromptDetailPriceBadge'], ['record-prompt-view', 'RecordPromptView'], ['saved-prompt-button', 'SavedPromptButton']]) {
    mocks[`@/components/${file}`] = { [name]: Null };
  }
  mocks['@/components/PremiumPromptUnlock'] = await load('components/PremiumPromptUnlock.jsx', mocks);
  mocks['next/link'] = ({ children, href }) => React.createElement('a', { href }, children);
  const Page = (await load('app/prompts/[slug]/page.js', mocks)).default;
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'test' }) }));
}

test('locked premium detail omits sample and tips entirely', async () => {
  for (const [type, price] of [['premium', 0], ['free', 99]]) {
    const html = await renderDetail(type, price);
    assert.match(html, /Unlock the prompt console/);
    assert.doesNotMatch(html, /Private sample content|Private tips content|Sample output|Inspect the sample|prompt-tips-box|prompt-workspace-sample/);
  }
});

test('unlocked premium detail restores sample and compact tips beside the prompt console', async () => {
  const html = await renderDetail('premium', 99, 'Purchased prompt');
  assert.match(html, /Private sample content/);
  assert.match(html, /Private tips content/);
  assert.match(html, /Purchased prompt/);
  assert.match(html, /prompt-detail-workspace-unlocked/);
  assert.match(html, /prompt-tips-scroll/);
  assert.match(html, /aria-label="Prompt tips" tabindex="0"/);
  assert.doesNotMatch(html, /Unlock the prompt console/);
});

test('free detail retains sample, compact tips, and usage steps', async () => {
  const html = await renderDetail('free');
  assert.match(html, /Private sample content/);
  assert.match(html, /Private tips content/);
  assert.match(html, /Inspect the sample/);
  assert.match(html, /prompt-tips-scroll/);
});

test('checkout callback and returning-user fetch both restore the complete unlocked workspace', async () => {
  for (const returning of [false, true]) {
    const state = [];
    let index = 0;
    let checkout;
    const effects = [];
    const mocks = await unlockMocks({
      react: { ...React,
        useState: initial => { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], value => { state[slot] = value; }]; },
        useEffect: effect => { effects.push(effect); }
      },
      '@/components/PromptCheckoutModal': { PromptCheckoutModal: props => { checkout = props; return null; } }
    });
    const { PremiumPromptUnlock } = await load('components/PremiumPromptUnlock.jsx', mocks);
    const render = () => {
      index = 0;
      return renderToStaticMarkup(React.createElement(PremiumPromptUnlock, { prompt, includeDetails: true }));
    };
    assert.doesNotMatch(render(), /Private sample content|Private tips content/);
    if (returning) {
      effects[0]();
      await new Promise(resolve => setImmediate(resolve));
    } else {
      checkout.onUnlocked({ ...prompt, prompt: 'Purchased prompt' });
    }
    const html = render();
    assert.match(html, /Purchased prompt/);
    assert.match(html, /Private sample content/);
    assert.match(html, /Private tips content/);
  }
});
