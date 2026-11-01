"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TaxonomySelect, taxonomyRequest } from "./admin-taxonomy-controls";
import { AdminPromptBulkActions } from "./admin-prompt-list-taxonomy";
import { DeletePromptButton } from "./delete-prompt-button";
import { ProtectedImage } from "./protected-media";
import { getPromptImageSource } from "@/lib/prompt-visuals";
import { formatPromptPrice } from "@/lib/prompt-pricing";

export default function AdminTaxonomyPrompts() {
  const [query, setQuery] = useState({ q: "", categoryId: "", subcategoryId: "", tagId: "", collectionId: "", classificationStatus: "", pricing: "", status: "" });
  const [page, setPage] = useState(1); const [result, setResult] = useState({ data: [], pagination: {} });
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(true);
  const requestRevision = useRef(0);
  const load = useCallback(async () => {
    const revision = ++requestRevision.current;
    setLoading(true);
    try { const response = await taxonomyRequest(`prompts?${new URLSearchParams({ ...query, page: String(page), limit: "25" })}`); if (revision !== requestRevision.current) return; setResult(response); setError(""); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [query, page]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  function filter(key, value) { setQuery(q => ({ ...q, [key]: value, ...(key === "categoryId" ? { subcategoryId: "" } : {}) })); setPage(1); }
  return <div className="stack">
    <div className="admin-toolbar"><label className="field">Search prompts<input value={query.q} onChange={e => filter("q", e.target.value)} placeholder="Title, description, tags" /></label><Link className="button" href="/admin/prompts/new">Add New Prompt</Link></div>
    <details className="panel form-card taxonomy-disclosure"><summary>Taxonomy and status filters</summary><div className="form-grid">
      <TaxonomySelect resource="categories" label="Main category filter" active={false} parentId="null" value={query.categoryId} onChange={v => filter("categoryId", v)} />
      {query.categoryId ? <TaxonomySelect key={query.categoryId} resource="categories" label="Subcategory filter" active={false} parentId={query.categoryId} value={query.subcategoryId} onChange={v => filter("subcategoryId", v)} /> : null}
      <TaxonomySelect resource="tags" label="Tag filter" active={false} value={query.tagId} onChange={v => filter("tagId", v)} />
      <TaxonomySelect resource="collections" label="Collection filter" active={false} value={query.collectionId} onChange={v => filter("collectionId", v)} />
      <label className="field">Classification<select value={query.classificationStatus} onChange={e => filter("classificationStatus", e.target.value)}><option value="">All</option><option value="unclassified">Needs classification</option><option value="reviewed">Reviewed</option></select></label>
      <label className="field">Pricing<select value={query.pricing} onChange={e => filter("pricing", e.target.value)}><option value="">Free and premium</option><option value="free">Free</option><option value="premium">Premium</option></select></label>
      <label className="field">Status<select value={query.status} onChange={e => filter("status", e.target.value)}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
    </div></details>
    <AdminPromptBulkActions onUpdated={load} />
    {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}{loading ? <p role="status">Loading prompts…</p> : null}
    <section className="panel form-card stack"><p>{result.pagination.total || 0} prompt records</p><div className="table-wrap"><table className="table"><thead><tr><th>Select</th><th>Prompt</th><th>Classification</th><th>Status</th><th>Price</th><th>Views</th><th>Actions</th></tr></thead><tbody>{result.data.map(p => {
      const image = getPromptImageSource(p);
      return <tr key={p._id}><td><input aria-label={`Select ${p.title}`} type="checkbox" form="taxonomy-bulk-form" name="promptIds" value={p._id} /></td><td><div className="admin-prompt-summary">{image ? <ProtectedImage alt="" src={image} width={72} height={72} /> : null}<div><strong>{p.title}</strong><p className="muted">{p.slug}</p><p>{p.description?.slice(0, 92)}</p><span>{p.category || "Uncategorized"}</span></div></div></td><td>{p.classificationStatus || "unclassified"}</td><td>{p.status}</td><td>{formatPromptPrice(p)}</td><td>{Number(p.viewsCount || 0).toLocaleString("en-IN")} views</td><td><div className="pill-row"><Link href={`/admin/prompts/${p._id}/edit`}>Edit</Link>{p.slug ? <Link target="_blank" rel="noopener noreferrer" href={`/prompts/${p.slug}`}>View</Link> : null}<DeletePromptButton onDeleted={load} id={p._id} /></div></td></tr>;
    })}</tbody></table></div>{!loading && !result.data.length ? <p>No prompts found. Broaden the filters or create a prompt.</p> : null}
    <nav className="admin-pagination" aria-label="Prompt pages"><button type="button" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)}>Previous</button><span>Page {page} of {result.pagination.pages || 1}</span><button type="button" disabled={page >= (result.pagination.pages || 1) || loading} onClick={() => setPage(v => v + 1)}>Next</button></nav></section>
  </div>;
}
