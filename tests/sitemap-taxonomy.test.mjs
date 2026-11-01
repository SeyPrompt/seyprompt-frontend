import test from 'node:test';
import assert from 'node:assert/strict';
import { sitemapEntries, sitemapXml } from '../lib/sitemap.mjs';
test('sitemap includes canonical taxonomy paths once and excludes empty, private routes and invalid slugs', () => {
  const data = { prompts: [{ slug: 'one' }, { slug: 'one' }, { slug: 'Invalid' }], categories: [{ path: '/categories/design/logo', count: 2 }, { path: '/categories/empty', count: 0 }], tags: [{ path: '/tags/logo', count: 2 }, { path: '/admin/secret', count: 2 }], collections: [{ path: '/collections/launch', count: 1 }] };
  const paths = sitemapEntries(data).map(r => r.path);
  assert.ok(paths.includes('/categories/design/logo')); assert.ok(paths.includes('/tags/logo')); assert.ok(paths.includes('/collections/launch'));
  assert.equal(paths.filter(p => p === '/prompts/one').length, 1); assert.equal(paths.includes('/admin/secret'), false); assert.equal(paths.includes('/categories/empty'), false);
  assert.match(sitemapXml(data, 'https://www.seyprompt.com'), /<loc>https:\/\/www.seyprompt.com\/tags\/logo<\/loc>/);
});
