"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TagPicker, TaxonomySelect, taxonomyRequest } from "./admin-taxonomy-controls";
export function AdminPromptFilters({ initial = {} }) {
  const [filters, setFilters] = useState(initial);
  const set = (key, value) => setFilters(v => ({ ...v, [key]: value, ...(key === "categoryId" ? { subcategoryId: "" } : {}) }));
  return <details><summary>Taxonomy filters</summary><div className="stack">
    {Object.entries(filters).map(([key, value]) => <input type="hidden" key={key} name={key} value={value} readOnly />)}
    <TaxonomySelect resource="categories" parentId="null" active={false} label="Main category filter" value={filters.categoryId} onChange={v => set("categoryId", v)} />
    {filters.categoryId ? <TaxonomySelect key={filters.categoryId} resource="categories" active={false} parentId={filters.categoryId} label="Subcategory filter" value={filters.subcategoryId} onChange={v => set("subcategoryId", v)} /> : null}
    <TaxonomySelect resource="tags" active={false} label="Tag filter" value={filters.tagId} onChange={v => set("tagId", v)} />
    <TaxonomySelect resource="collections" active={false} label="Collection filter" value={filters.collectionId} onChange={v => set("collectionId", v)} />
    <label className="field">Classification<select value={filters.classificationStatus || ""} onChange={e => set("classificationStatus", e.target.value)}><option value="">All</option><option value="unclassified">Needs classification</option><option value="reviewed">Reviewed</option></select></label>
    <label className="field">Pricing<select value={filters.pricing || ""} onChange={e => set("pricing", e.target.value)}><option value="">All</option><option value="free">Free</option><option value="premium">Premium</option></select></label>
  </div></details>;
}
export function AdminPromptBulkActions({ onUpdated }) {
  const router = useRouter(); const [action, setAction] = useState("category"); const [main, setMain] = useState(""); const [sub, setSub] = useState("");
  const [tags, setTags] = useState([]); const [collection, setCollection] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function apply(e) {
    e.preventDefault(); setMessage("");
    const promptIds = [...new Set(new FormData(e.currentTarget).getAll("promptIds"))];
    if (!promptIds.length) { setMessage("Select prompts from this page first."); return; }
    if (!window.confirm(`Apply ${action} to ${promptIds.length} selected prompts?`)) return;
    setBusy(true);
    try {
      if (action === "reclassify") { const r = await taxonomyRequest("migration/preview", { promptIds }); router.push(`/admin/taxonomy/migration?runId=${r.runId}`); return; }
      const r = await taxonomyRequest("bulk-update", { promptIds, action: ["include", "remove"].includes(action) ? "collection" : action, categoryId: sub || main, tagIds: tags.map(v => v._id), collectionId: collection, membershipAction: action });
      setMessage(`${r.updated} prompts updated.`); onUpdated?.(); router.refresh();
      document.querySelectorAll('input[form="taxonomy-bulk-form"]').forEach(input => { input.checked = false; });
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  return <details className="panel form-card"><summary>Bulk taxonomy actions</summary><form id="taxonomy-bulk-form" className="stack" onSubmit={apply}><fieldset className="stack taxonomy-bulk-fieldset" disabled={busy}>
    <p>Select prompts on the current page. <Link href="/admin/taxonomy/bulk">Open bulk management</Link></p>
    <div className="pill-row"><button type="button" onClick={() => document.querySelectorAll('input[form="taxonomy-bulk-form"]').forEach(input => { input.checked = true; })}>Select page</button><button type="button" onClick={() => document.querySelectorAll('input[form="taxonomy-bulk-form"]').forEach(input => { input.checked = false; })}>Clear selection</button></div>
    <label className="field">Action<select value={action} onChange={e => setAction(e.target.value)}><option value="category">Assign category</option><option value="add-tags">Add tags</option><option value="remove-tags">Remove tags</option><option value="include">Add to manual collection</option><option value="remove">Remove from manual collection</option><option value="reclassify">Suggest reclassification for review</option></select></label>
    {action === "category" ? <><TaxonomySelect resource="categories" parentId="null" label="Assign main category" required value={main} onChange={v => { setMain(v); setSub(""); }} />{main ? <TaxonomySelect key={main} resource="categories" parentId={main} label="Assign subcategory" value={sub} onChange={setSub} /> : null}</> : null}
    {["add-tags", "remove-tags"].includes(action) ? <TagPicker value={tags} allowCreate={false} onChange={setTags} /> : null}
    {["include", "remove"].includes(action) ? <TaxonomySelect resource="collections" collectionType="manual" label="Manual collection" required value={collection} onChange={setCollection} /> : null}
    <button>{busy ? "Applying…" : "Apply selected action"}</button>
  </fieldset>{message ? <p role="status">{message}</p> : null}</form></details>;
}
