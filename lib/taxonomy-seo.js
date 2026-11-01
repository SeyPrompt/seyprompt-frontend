import { createPageMetadata, absoluteUrl, breadcrumbSchema, truncateDescription } from './seo';
export const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
export function taxonomyMetadata(record, filtered = false) {
  if (!record) return { title: 'Not Found', robots: { index: false, follow: false } };
  const description = truncateDescription(record.seoDescription || record.description || `Explore ${record.name} AI prompts, ready to adapt to your next project.`);
  return { ...createPageMetadata({ title: record.seoTitle || `${record.name} AI Prompts`, description, path: record.path, ...(record.image ? { image: record.image, imageAlt: record.name } : {}), keywords: [record.name, record.parent?.name, 'AI prompts'].filter(Boolean) }), robots: { index: record.count > 0 && !filtered, follow: true } };
}
export function taxonomySchemas(record, prompts = []) {
  return [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: record.name, description: record.seoDescription || record.description, url: absoluteUrl(record.path), mainEntity: { '@type': 'ItemList', itemListElement: prompts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, url: absoluteUrl(`/prompts/${p.slug}`) })) } },
    breadcrumbSchema([{ name: 'Home', path: '/' }, ...(record.parent ? [{ name: record.parent.name, path: record.parent.path }] : []), { name: record.name, path: record.path }])
  ];
}
