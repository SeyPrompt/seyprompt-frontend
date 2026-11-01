import Link from 'next/link';
import { fetchPublicTaxonomy } from '@/lib/api';
import { createPageMetadata } from '@/lib/seo';
export const metadata = createPageMetadata({ title: 'Prompt Categories', path: '/categories', description: 'Explore AI prompts by category and subcategory.' });
export default async function CategoriesPage() {
  const { categories } = await fetchPublicTaxonomy();
  return <main className="section"><div className="container stack"><h1 className="page-title">Explore prompt categories</h1>{categories.filter(c => !c.parent).map(c => <section className="panel stack" key={c.id}><h2><Link href={c.path}>{c.name}</Link></h2><nav className="pill-row" aria-label={`${c.name} subcategories`}>{categories.filter(sub => sub.parent?.id === c.id).map(sub => <Link className="pill" key={sub.id} href={sub.path}>{sub.name} ({sub.count})</Link>)}</nav></section>)}</div></main>;
}
