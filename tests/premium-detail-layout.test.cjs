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

async function renderDetail(pricingType, price = 0, promptText = '') {
  const prompt = { title: 'Test prompt', slug: 'test', pricingType, price, prompt: promptText,
    tips: 'Private tips content', sampleOutput: { type: 'text', value: 'Private sample content' } };
  const Null = () => null;
  const mocks = {
    '@/lib/api': { fetchPromptBySlug: async () => prompt, fetchPublicPrompts: async () => ({ data: [] }) },
    '@/lib/prompt-pricing': await load('lib/prompt-pricing.js'),
    '@/lib/prompt-metadata': { getPromptCategories: () => [], getPrimaryPromptCategory: () => '', getPromptCategoryLabel: () => '' },
    '@/utils/categoryIcons': { getCategoryIcon: () => Null },
    '@/lib/seo': { absoluteUrl: x => x, breadcrumbSchema: () => ({}), promptSchema: () => ({}), truncateDescription: x => x },
    '@/components/protected-media': {},
    '@/components/PromptAccessLink': { PromptAccessLink: Null },
    '@/components/PromptLoginGate': { PromptLoginGate: Null },
    '@/components/prompt-detail-price-badge': { PromptDetailPriceBadge: Null },
    '@/components/record-prompt-view': { RecordPromptView: Null },
    '@/components/saved-prompt-button': { SavedPromptButton: Null },
    '@/components/PremiumPromptUnlock': { PremiumPromptUnlock: () => React.createElement('section', null, 'Unlock the prompt console') },
    'next/link': ({ children, href }) => React.createElement('a', { href }, children)
  };
  const Page = (await load('app/prompts/[slug]/page.js', mocks)).default;
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'test' }) }));
}

test('premium detail renders the unlock console without sample, tips, or sample steps', async () => {
  for (const [type, price, text] of [['premium', 0, ''], ['free', 99, ''], ['premium', 99, 'Purchased prompt']]) {
    const html = await renderDetail(type, price, text);
    assert.match(html, /Unlock the prompt console/);
    assert.match(html, /prompt-detail-workspace-premium/);
    assert.doesNotMatch(html, /Private sample content|Private tips content|Sample output|Inspect the sample|prompt-tips-box|prompt-workspace-sample/);
  }
});

test('free detail retains the sample output, tips, and usage steps', async () => {
  const html = await renderDetail('free');
  assert.match(html, /Private sample content/);
  assert.match(html, /Private tips content/);
  assert.match(html, /Inspect the sample/);
  assert.doesNotMatch(html, /prompt-detail-workspace-premium/);
});
