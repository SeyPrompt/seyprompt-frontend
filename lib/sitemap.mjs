const staticPaths = ['/', '/categories', '/tags', '/collections', '/ai-prompt-guide', '/ai-tools', '/use-cases', '/about', '/contact', '/privacy-policy', '/terms-of-use', '/refund-policy', '/shipping-policy'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function sitemapEntries(data) {
  const taxonomy = ['categories', 'tags', 'collections'].flatMap(kind => (data[kind] || []).filter(r => r.count > 0 && typeof r.path === 'string' && new RegExp(`^/${kind}/[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)?$`).test(r.path)).map(r => ({ path: r.path, updatedAt: r.updatedAt })));
  const prompts = (data.prompts || []).filter(p => slugPattern.test(p.slug)).map(p => ({ path: `/prompts/${p.slug}`, updatedAt: p.updatedAt }));
  return [...new Map([...staticPaths.map(path => ({ path })), ...taxonomy, ...prompts].map(r => [r.path, r])).values()];
}
const xml = value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
export function sitemapXml(data, siteUrl) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemapEntries(data).map(row => { const date = row.updatedAt && new Date(row.updatedAt); return `<url><loc>${xml(siteUrl.replace(/\/$/, '') + row.path)}</loc>${date && Number.isFinite(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : ''}</url>`; }).join('') + '</urlset>';
}
