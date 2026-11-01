import Link from 'next/link';
import { fetchPublicTaxonomy } from '@/lib/api';
import { createPageMetadata } from '@/lib/seo';
export const metadata = createPageMetadata({ title: 'Prompt Tags', path: '/tags', description: 'Explore AI prompts by topic, style, audience, and use case.' });
export default async function TagsPage() {
  const { tags } = await fetchPublicTaxonomy();
  return <main className="section"><div className="container stack"><h1 className="page-title">Explore prompt tags</h1><nav className="pill-row" aria-label="Prompt tags">{tags.filter(t => t.count > 0).map(t => <Link className="pill" key={t.id} href={t.path}>{t.name} ({t.count})</Link>)}</nav></div></main>;
}
