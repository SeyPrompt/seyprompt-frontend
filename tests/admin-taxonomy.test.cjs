const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
let current;
// Small hook adapter lets Node exercise event handlers and asynchronous loading
// without adding a DOM/test-framework dependency. The Next production build checks
// the actual React compilation; browser integration is a separate staging check.
const hooks = { ...React,
  useState(initial) { const h = current, i = h.index++; if (!(i in h.state)) h.state[i] = typeof initial === 'function' ? initial() : initial; return [h.state[i], next => { h.state[i] = typeof next === 'function' ? next(h.state[i]) : next; }]; },
  useRef(initial) { const [value] = hooks.useState(() => ({ current: initial })); return value; },
  useEffect(fn, deps) { const h = current, i = h.index++; if (!h.deps[i] || deps.some((v, j) => v !== h.deps[i][j])) { h.deps[i] = deps; h.effects.push(fn); } },
  useCallback(fn) { return fn; },
};
const cache = new Map();
function load(filename) {
  filename = path.resolve(root, filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code;
  const mod = { exports: {} }; cache.set(filename, mod);
  function localRequire(name) {
    if (name === 'react') return hooks;
    if (name === 'next/link') return props => React.createElement('a', props);
    if (name === 'next/navigation') return { useRouter: () => ({ push() {}, refresh() {} }), usePathname: () => '/admin' };
    if (name.startsWith('.') || name.startsWith('@/')) {
      const base = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = ['', '.js', '.jsx'].map(s => base + s).find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      return load(resolved);
    }
    return require(name);
  }
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename })(localRequire, mod, mod.exports);
  return mod.exports;
}
function harness(Component, props) {
  const h = { state: [], deps: [], effects: [], index: 0, cleanups: [], tree: null };
  h.render = () => { current = h; h.index = 0; h.tree = Component(props); current = null; return h.tree; };
  h.flush = () => { for (const effect of h.effects.splice(0)) { const cleanup = effect(); if (cleanup) h.cleanups.push(cleanup); } };
  h.close = () => h.cleanups.forEach(fn => fn()); h.render(); return h;
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(v => nodes(v, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let controls;
test.before(async () => { await swc.loadBindings(); controls = load('components/admin-taxonomy-controls.jsx'); });
test('category dropdown loads paginated backend options and forwards selected value', async ctx => {
  const requests = [], selected = [];
  ctx.mock.method(global, 'fetch', async url => { requests.push(url); return { ok: true, json: async () => ({ data: [{ _id: 'a', name: 'Personal & Lifestyle' }], pagination: { pages: 2 } }) }; });
  const h = harness(controls.TaxonomySelect, { resource: 'categories', label: 'Main category', parentId: 'null', required: true, onChange: (...v) => selected.push(v) });
  h.flush(); await wait(240); h.render();
  assert.match(requests[0], /parentId=null/); assert.match(requests[0], /status=active/); assert.match(requests[0], /limit=25/);
  const select = nodes(h.tree, v => v.type === 'select')[0];
  assert.equal(select.props.required, true); select.props.onChange({ target: { value: 'a' } });
  assert.equal(selected[0][1].name, 'Personal & Lifestyle'); h.close();
});
test('subcategory dropdown requests only its selected parent and reports load errors', async ctx => {
  const requests = [];
  ctx.mock.method(global, 'fetch', async url => { requests.push(url); return { ok: false, json: async () => ({ error: 'Unavailable' }) }; });
  const h = harness(controls.TaxonomySelect, { resource: 'categories', label: 'Subcategory', parentId: 'a'.repeat(24), onChange() {} });
  h.flush(); await wait(240); h.render();
  assert.match(requests[0], new RegExp(`parentId=${'a'.repeat(24)}`)); assert.equal(nodes(h.tree, v => v.props?.role === 'alert')[0].props.children, 'Unavailable'); h.close();
});
test('tag autocomplete adds with Enter, prevents duplicates and removes selected tags', async ctx => {
  const added = [], value = [{ _id: 'a', name: 'family' }];
  ctx.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ({ data: [{ _id: 'a', name: 'family' }, { _id: 'b', name: 'halloween' }] }) }));
  const h = harness(controls.TagPicker, { value, onChange: v => added.push(v) });
  h.flush(); await wait(240); h.render();
  const input = nodes(h.tree, v => v.type === 'input')[0]; let prevented = false;
  input.props.onKeyDown({ key: 'Enter', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.deepEqual(added[0].map(v => v._id), ['a', 'b']);
  nodes(h.tree, v => v.type === 'button' && v.props['aria-label'] === 'Remove tag family')[0].props.onClick();
  assert.deepEqual(added[1], []); h.close();
});
test('authorized tag creation sends a normalized slug through the admin API', async ctx => {
  const calls = [], changes = [];
  ctx.mock.method(global, 'fetch', async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => options?.method ? { _id: 'new', name: 'New Tag' } : { data: [] } }; });
  const h = harness(controls.TagPicker, { value: [], onChange: v => changes.push(v) });
  nodes(h.tree, v => v.type === 'input')[0].props.onChange({ target: { value: 'New Tag' } }); h.render();
  await nodes(h.tree, v => v.type === 'button' && String(v.props.children?.[0]).includes('Create tag'))[0].props.onClick();
  const request = calls.find(v => v.options?.method === 'POST');
  assert.equal(JSON.parse(request.options.body).slug, 'new-tag'); assert.equal(changes[0][0]._id, 'new'); h.close();
});
test('prompt editing prepopulates parent, subcategory, tags and manual collection IDs', async ctx => {
  ctx.mock.method(global, 'fetch', async url => ({ ok: true, json: async () => url.includes('categories/') ? { _id: 'sub', parentId: 'main', name: 'Family & Kids' } : url.includes('tags/') ? { _id: 'tag', name: 'family' } : { data: [{ _id: 'collection', name: 'Manual', collectionType: 'manual' }] } }));
  const Component = load('components/admin-prompt-taxonomy.jsx').default, changes = [];
  const h = harness(Component, { prompt: { _id: 'p', categoryId: 'sub', tagIds: ['tag'] }, onChange: v => changes.push(v) });
  h.flush(); await wait(20); h.render();
  const selectors = nodes(h.tree, v => v.type === controls.TaxonomySelect);
  assert.equal(selectors[0].props.value, 'main'); assert.equal(selectors[1].props.value, 'sub');
  assert.deepEqual(changes[0], { secondaryCategoryIds: [], categoryId: 'sub', tagIds: ['tag'], manualCollectionIds: ['collection'] });
  selectors[0].props.onChange('different'); h.render();
  assert.equal(nodes(h.tree, v => v.type === controls.TaxonomySelect)[1].props.value, ''); h.close();
});
test('admin request helper forwards method, payload and backend validation errors', async ctx => {
  let options;
  ctx.mock.method(global, 'fetch', async (_url, init) => { options = init; return { ok: false, json: async () => ({ error: 'Duplicate slug.' }) }; });
  await assert.rejects(controls.taxonomyRequest('categories/a', { name: 'Test' }, 'PATCH'), /Duplicate slug/);
  assert.equal(options.method, 'PATCH'); assert.equal(options.headers['Content-Type'], 'application/json'); assert.deepEqual(JSON.parse(options.body), { name: 'Test' });
});
test('collection editor sends dynamic ANY/ALL rules and previews backend membership', async ctx => {
  const calls = [];
  ctx.mock.method(global, 'fetch', async (url, options) => {
    const body = options?.body ? JSON.parse(options.body) : {};
    calls.push({ url, body });
    const result = !options?.method ? { data: [], pagination: { pages: 1, total: 0 }, tagTypes: ['General'] } : url.endsWith('/preview') ? { data: [{ _id: 'p', title: 'Matching prompt' }], pagination: { total: 1 } } : { _id: 'saved', ...body };
    return { ok: true, json: async () => result };
  });
  const Component = load('components/admin-taxonomy-manager.jsx').default;
  const h = harness(Component, { section: 'collections' });
  await nodes(h.tree, v => v.type === 'button' && String(v.props.children?.[0]).startsWith('Create'))[0].props.onClick(); h.render();
  let form = nodes(h.tree, v => v.type === 'form')[0];
  const inputs = nodes(form, v => v.type === 'input');
  inputs.find(v => v.props.maxLength === 120).props.onChange({ target: { value: 'Halloween' } }); h.render();
  nodes(h.tree, v => v.type === 'input' && v.props.pattern)[0].props.onChange({ target: { value: 'halloween' } }); h.render();
  const typeSelect = nodes(h.tree, v => v.type === 'select' && v.props.value === 'manual')[0];
  typeSelect.props.onChange({ target: { value: 'dynamic' } }); h.render();
  nodes(h.tree, v => v.type === 'select' && v.props.value === 'any')[0].props.onChange({ target: { value: 'all' } }); h.render();
  nodes(h.tree, v => v.type === controls.TagPicker)[0].props.onChange([{ _id: 'tag', name: 'halloween' }]); h.render();
  await nodes(h.tree, v => v.type === 'form')[0].props.onSubmit({ preventDefault() {} }); h.render();
  const saved = calls.find(v => v.url.endsWith('/collections') && v.body.collectionType);
  assert.equal(saved.body.filterRules.match, 'all'); assert.deepEqual(saved.body.filterRules.tagIds, ['tag']);
  await nodes(h.tree, v => v.type === 'button' && v.props.children === 'Preview these rules')[0].props.onClick(); h.render();
  assert.ok(calls.some(v => v.url.endsWith('/saved/preview')));
  assert.ok(nodes(h.tree, v => v.type === 'p' && v.props.children === 'Matching prompt').length); h.close();
});
test('bulk actions submit selected IDs with explicit confirmation and refresh', async ctx => {
  const calls = [], selected = ['a'.repeat(24), 'b'.repeat(24)]; let confirmed = false, refreshed = false;
  ctx.mock.method(global, 'fetch', async (_url, options) => { calls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ updated: 2 }) }; });
  const previousWindow = global.window, previousDocument = global.document;
  global.window = { confirm() { confirmed = true; return true; } }; global.document = { querySelectorAll: () => [] };
  ctx.after(() => { global.window = previousWindow; global.document = previousDocument; });
  const originalFormData = global.FormData;
  global.FormData = class { getAll() { return selected; } };
  ctx.after(() => { global.FormData = originalFormData; });
  const Component = load('components/admin-prompt-list-taxonomy.jsx').AdminPromptBulkActions;
  const h = harness(Component, { onUpdated() { refreshed = true; } });
  nodes(h.tree, v => v.type === controls.TaxonomySelect)[0].props.onChange('c'.repeat(24)); h.render();
  await nodes(h.tree, v => v.type === 'form')[0].props.onSubmit({ preventDefault() {}, currentTarget: {} });
  assert.equal(confirmed, true); assert.equal(refreshed, true); assert.deepEqual(calls[0].promptIds, selected); assert.equal(calls[0].action, 'category'); h.close();
});
test('migration review applies only explicitly selected rows and category overrides', async ctx => {
  const calls = [];
  const previousWindow = global.window, previousStorage = global.localStorage;
  global.window = { location: { search: '?runId=run-1' }, confirm: () => true };
  global.localStorage = { getItem: () => null };
  ctx.after(() => { global.window = previousWindow; global.localStorage = previousStorage; });
  ctx.mock.method(global, 'fetch', async (url, options) => { const body = options?.body ? JSON.parse(options.body) : {}; calls.push({ url, body }); return { ok: true, json: async () => options?.method ? { applied: 1 } : { data: [{ _id: 'review', title: 'Ambiguous', confidence: 'low', proposedCategoryId: null }], summary: [], pagination: { pages: 1 } } }; });
  const Component = load('components/admin-taxonomy-migration.jsx').default;
  const h = harness(Component, {}); h.flush(); h.render(); h.flush(); await wait(20); h.render();
  nodes(h.tree, v => v.type === 'input' && v.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } }); h.render();
  nodes(h.tree, v => v.type === 'button' && v.props.children === 'Choose category')[0].props.onClick(); h.render();
  nodes(h.tree, v => v.type === controls.TaxonomySelect)[0].props.onChange('category'); h.render();
  await nodes(h.tree, v => v.type === 'button' && v.props.children === 'Approve and apply selected')[0].props.onClick();
  const apply = calls.find(v => v.url.endsWith('/apply'));
  assert.equal(apply.body.confirm, true); assert.deepEqual(apply.body.approvals, [{ reviewId: 'review', categoryId: 'category' }]); h.close();
});
test('taxonomy-only prompt edits preserve pricing; intentional free conversion clears legacy price', async ctx => {
  const requests = [], originalFormData = global.FormData;
  const values = { title: 'Existing premium prompt', slug: 'existing-url', prompt: 'Existing prompt content.', status: 'published', visibility: 'public' };
  global.FormData = class { get(key) { return values[key] || null; } };
  ctx.after(() => { global.FormData = originalFormData; });
  ctx.mock.method(global, 'fetch', async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ _id: 'saved' }) }; });
  const Component = load('components/prompt-form.js').PromptForm;
  const h = harness(Component, { mode: 'edit', prompt: { _id: 'p', title: values.title, slug: values.slug, prompt: values.prompt, price: 49, pricingType: 'premium', category: 'Legacy category', directPurchaseEnabled: true } });
  const PromptTaxonomy = load('components/admin-prompt-taxonomy.jsx').default;
  nodes(h.tree, v => v.type === PromptTaxonomy)[0].props.onChange({ categoryId: 'a'.repeat(24), tagIds: [], manualCollectionIds: [] }); h.render();
  await h.tree.props.onSubmit({ preventDefault() {}, currentTarget: {} });
  assert.equal(requests[0].preservePricing, true); assert.equal(requests[0].price, undefined); assert.equal(requests[0].regionalPrices, undefined);
  nodes(h.tree, v => v.type === 'input' && v.props.id === 'pricingTypeFree')[0].props.onChange();
  nodes(h.tree, v => v.type === 'section' && v.props['aria-label'] === 'Prompt pricing')[0].props.onChange(); h.render();
  await h.tree.props.onSubmit({ preventDefault() {}, currentTarget: {} });
  assert.equal(requests[1].preservePricing, undefined); assert.equal(requests[1].price, 0); assert.equal(requests[1].pricingType, 'free'); h.close();
});

test('additional placements prepopulate and support more than two while excluding the primary', async ctx => {
  ctx.mock.method(global, 'fetch', async (url, options) => ({ ok: true, json: async () => url.includes('categories/') ? { _id: url.split('/').at(-1), name: 'Placement', status: 'active' } : { data: [] } }));
  const Component = load('components/admin-prompt-taxonomy.jsx').default, changes = [];
  const h = harness(Component, { prompt: { categoryId: 'primary', secondaryCategoryIds: ['one', 'two', 'three'] }, onChange: v => changes.push(v) });
  h.flush(); await wait(20); h.render();
  const placement = nodes(h.tree, v => v.type === controls.TaxonomySelect && v.props.label === 'Also show in')[0];
  assert.equal(placement.props.selected.length, 3);
  placement.props.onChange([{ _id: 'primary' }, { _id: 'one' }, { _id: 'two' }, { _id: 'three' }, { _id: 'four' }]);
  assert.deepEqual(changes.at(-1).secondaryCategoryIds, ['one', 'two', 'three', 'four']); h.close();
});

test('gallery editor preserves cover through reorder, supports separate prompts and detaches images', async () => {
  const Editor = load('components/admin-sample-gallery.jsx').default;
  const first = { id: 'first', value: 'https://example.com/front.png', instructions: 'Front view' }, second = { id: 'second', value: 'https://example.com/back.png', instructions: 'Back view' };
  let value = { images: [first, second], mode: 'per-image', coverId: 'first' }, latest;
  const props = { value, onChange: next => { latest = next; props.value = next; }, onBusyChange() {} };
  const h = harness(Editor, props);
  nodes(h.tree, n => n.type === 'button' && n.props['aria-label'] === 'Move sample 2 up')[0].props.onClick(); h.render();
  assert.deepEqual(latest.images.map(i => i.id), ['second', 'first']); assert.equal(latest.coverId, 'first');
  nodes(h.tree, n => n.type === 'input' && n.props.type === 'radio')[0].props.onChange(); h.render();
  assert.equal(latest.coverId, 'second');
  nodes(h.tree, n => n.type === 'button' && n.props['aria-label'] === 'Remove sample 1')[0].props.onClick(); h.render();
  assert.equal(latest.coverId, 'first'); assert.equal(latest.images[0].instructions, 'Front view'); h.close();
});
