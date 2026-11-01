import Link from 'next/link';
import { fetchPublicPrompts } from '@/lib/api';
import { PromptCard } from '@/components/prompt-card';
import { taxonomySchemas, jsonLd } from '@/lib/taxonomy-seo';
export default async function TaxonomyLanding({ record, searchParams = {} }) {
  const page = Math.max(1, Number.parseInt(searchParams.page, 10) || 1);
  const q = typeof searchParams.q === 'string' ? searchParams.q.slice(0, 200) : '';
  const filter = record.kind === 'collections' ? { discoverCollection: record.slug } : record.kind === 'tags' ? { taxonomyTag: record.slug } : { category: record.slug };
  const result = await fetchPublicPrompts({ ...filter, q, page, limit: 24 });
  const pages = result.pagination?.pages || 0;
  return <main className="section"><div className="container stack">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(taxonomySchemas(record, result.data)) }} />
    <nav aria-label="Breadcrumb"><Link href="/">Discover</Link>{record.parent ? <> / <Link href={record.parent.path}>{record.parent.name}</Link></> : null} / {record.name}</nav>
    <header><h1 className="page-title">{record.name} AI Prompts</h1><p className="page-subtitle">{record.description || `Explore ready-to-use ${record.name} prompts for your next idea.`}</p><p className="muted">{result.pagination?.total || 0} prompts</p></header>
    {record.children?.length ? <nav className="pill-row" aria-label="Subcategories">{record.children.map(c => <Link className="pill" href={c.path} key={c.id}>{c.name}</Link>)}</nav> : null}
    <form role="search" className="pill-row"><label>Search this {record.kind === 'tags' ? 'tag' : 'category or collection'} <input type="search" name="q" defaultValue={q} maxLength={200} /></label><button className="button" type="submit">Search</button></form>
    {result.data.length ? <div className="grid">{result.data.map(p => <PromptCard key={p.id || p._id} prompt={p} />)}</div> : <p>No prompts match this selection yet.</p>}
    {pages > 1 ? <nav className="pagination" aria-label="Prompt pagination">{page > 1 ? <Link className="button-secondary" href={{ pathname: record.path, query: { ...(q ? { q } : {}), page: page - 1 } }}>Previous</Link> : null}<span>Page {page} of {pages}</span>{page < pages ? <Link className="button-secondary" href={{ pathname: record.path, query: { ...(q ? { q } : {}), page: page + 1 } }}>Next</Link> : null}</nav> : null}
  </div></main>;
}
