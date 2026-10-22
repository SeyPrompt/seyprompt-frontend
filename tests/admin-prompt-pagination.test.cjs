const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const swc = require('next/dist/build/swc');

async function renderPage(params, pages = 5) {
  let request;
  const source = fs.readFileSync(path.join(__dirname, '../app/admin/(dashboard)/prompts/page.js'), 'utf8');
  const { code } = await swc.transform(source, {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' }
  });
  const mocks = {
    'next/link': ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/navigation': { redirect: (href) => { throw new Error(`redirect:${href}`); } },
    '@/lib/auth': { requireAdminToken: async () => 'test-token' },
    '@/lib/api': { fetchAdminPrompts: async (token, query) => {
      assert.equal(token, 'test-token');
      request = query;
      return { data: [{ id: 'p', title: 'Test prompt', slug: 'test', status: 'published' }], pagination: { total: 212, page: Number(query.page), pages } };
    } },
    '@/lib/prompt-metadata': { getPromptCategories: () => [] },
    '@/lib/prompt-pricing': { formatPromptPrice: () => 'Free', getPromptPricingType: () => 'free' },
    '@/lib/prompt-visuals': { getPromptImageSource: () => '' },
    '@/components/protected-media': { ProtectedImage: () => null },
    '@/components/delete-prompt-button': { DeletePromptButton: () => null }
  };
  const exports = {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { URLSearchParams })(
    (id) => mocks[id] || require(id), { exports }, exports
  );
  const element = await exports.default({ searchParams: Promise.resolve(params) });
  return { html: renderToStaticMarkup(element), request };
}

test('requests later pages and preserves encoded search and status in navigation', async () => {
  const { html, request } = await renderPage({ page: '3', q: 'art & design', status: 'draft' });
  assert.equal(request.page, '3');
  assert.equal(request.limit, '50');
  assert.match(html, /Page 3 of 5/);
  assert.match(html, /page=2&amp;q=art\+%26\+design&amp;status=draft/);
  assert.match(html, /page=4&amp;q=art\+%26\+design&amp;status=draft/);
  const form = html.match(/<form[\s\S]*?<\/form>/)[0];
  assert.doesNotMatch(form, /name="page"/);
});

test('first and last pages disable the unavailable navigation', async () => {
  const first = await renderPage({});
  assert.match(first.html, /<button[^>]*disabled=""[^>]*>Previous<\/button>/);
  const last = await renderPage({ page: '5' });
  assert.match(last.html, /<button[^>]*disabled=""[^>]*>Next<\/button>/);
});

test('invalid page numbers fall back to page one', async () => {
  for (const page of ['bad', '-1', '1.5', 'Infinity']) {
    assert.equal((await renderPage({ page })).request.page, '1');
  }
});

test('out-of-range pages redirect to the last available page with filters', async () => {
  await assert.rejects(renderPage({ page: '9', q: 'portrait', status: 'published' }, 4),
    /redirect:\/admin\/prompts\?page=4&q=portrait&status=published/);
});
