"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TagPicker, TaxonomySelect, taxonomyRequest, UnsavedWarning } from "./admin-taxonomy-controls";
import AdminTaxonomyPrompts from "./admin-taxonomy-prompts";
import AdminTaxonomyMigration from "./admin-taxonomy-migration";
const empty = { name: "", slug: "", description: "", status: "active", displayOrder: 0, seoTitle: "", seoDescription: "", parentId: "", icon: "", image: "", coverImage: "", tagType: "General", collectionType: "manual", filterRules: { match: "any", tagIds: [], categoryIds: [] } };
const sections = { categories: "Main Categories", subcategories: "Subcategories", tags: "Tags", collections: "Collections", migration: "Migration Review", bulk: "Bulk Management" };

function CollectionMembers({ collection }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [result, setResult] = useState({ data: [] });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [previewOnly, setPreviewOnly] = useState(true);
  const [selected, setSelected] = useState([]); const [action, setAction] = useState("include"); const [order, setOrder] = useState(0);
  const requestRevision = useRef(0);
  const load = useCallback(async () => {
    const revision = ++requestRevision.current;
    const path = previewOnly ? `collections/${collection._id}/prompts` : "prompts";
    try { const response = await taxonomyRequest(`${path}?${new URLSearchParams({ q, page: String(page), limit: "20" })}`); if (revision !== requestRevision.current) return; setResult(response); setSelected([]); setError(""); }
    catch (err) { setError(err.message); }
  }, [collection._id, previewOnly, q, page]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  async function apply() {
    if (!window.confirm(`Apply ${action} to ${selected.length} selected prompts?`)) return;
    setBusy(true);
    try { await taxonomyRequest("bulk-update", { promptIds: selected, action: "collection", collectionId: collection._id, membershipAction: action, displayOrder: Number(order) }); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="panel form-card stack taxonomy-members"><h3>Collection membership</h3>
    <label className="field">Search prompts<input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /></label>
    <label className="admin-checkbox"><input type="checkbox" checked={previewOnly} onChange={e => { setPreviewOnly(e.target.checked); setPage(1); }} /> Show matching members only</label>
    {error ? <p role="alert">{error}</p> : null}
    <p>{result.pagination?.total || 0} prompts. Pins sort first; display order breaks ties.</p>
    {result.data.map(p => <label className="taxonomy-member-row" key={p._id}><input type="checkbox" checked={selected.includes(p._id)} onChange={e => setSelected(v => e.target.checked ? [...v, p._id] : v.filter(id => id !== p._id))} />{p.title}</label>)}
    {collection.collectionType !== "dynamic" ? <div className="admin-toolbar"><select aria-label="Membership action" value={action} onChange={e => setAction(e.target.value)}><option value="include">Include</option><option value="pin">Pin / reorder</option>{collection.collectionType === "hybrid" ? <option value="exclude">Exclude</option> : null}<option value="remove">Remove manual override</option></select><label className="field">Starting display order<input type="number" min="0" value={order} onChange={e => setOrder(e.target.value)} /></label><button type="button" disabled={busy || !selected.length} onClick={apply}>Apply to selected</button></div> : null}
    <div className="pill-row"><button type="button" disabled={page === 1} onClick={() => setPage(v => v - 1)}>Previous</button><span>Page {page}</span><button type="button" disabled={page >= (result.pagination?.pages || 1)} onClick={() => setPage(v => v + 1)}>Next</button></div>
  </section>;
}

export default function AdminTaxonomyManager({ section }) {
  const resource = section === "subcategories" ? "categories" : section;
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [parent, setParent] = useState("");
  const [tagType, setTagType] = useState(""); const [types, setTypes] = useState(["General"]);
  const [page, setPage] = useState(1); const [result, setResult] = useState({ data: [], pagination: {} });
  const [editing, setEditing] = useState(null); const [form, setForm] = useState(empty); const [ruleTags, setRuleTags] = useState([]); const [ruleCategories, setRuleCategories] = useState([]);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [dirty, setDirty] = useState(false);
  const [mergeTarget, setMergeTarget] = useState(""); const [reassign, setReassign] = useState(""); const [preview, setPreview] = useState(null);
  const requestRevision = useRef(0);
  const load = useCallback(async () => {
    const revision = ++requestRevision.current;
    if (!["categories", "tags", "collections"].includes(resource)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page), limit: "25", ...(status ? { status } : {}), ...(resource === "tags" && tagType ? { tagType } : {}), ...(section === "categories" ? { parentId: "null" } : parent ? { parentId: parent } : {}) });
      if (section === "subcategories" && !parent) params.set("level", "sub");
      const response = await taxonomyRequest(`${resource}?${params}`); if (revision !== requestRevision.current) return; setResult(response); setError("");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [resource, q, page, status, tagType, parent, section]);
  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { taxonomyRequest("config").then(r => setTypes(r.tagTypes)).catch(err => setError(err.message)); }, []);
  function update(key, value) { setForm(v => ({ ...v, [key]: value })); setDirty(true); }
  async function edit(row) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setError(""); setPreview(null); setMergeTarget(""); setReassign("");
    try {
      const [tags, categories] = await Promise.all([
        Promise.all((row?.filterRules?.tagIds || []).map(id => taxonomyRequest(`tags/${id}`))),
        Promise.all((row?.filterRules?.categoryIds || []).map(id => taxonomyRequest(`categories/${id}`)))
      ]);
      setRuleTags(tags); setRuleCategories(categories); setForm({ ...empty, ...row, parentId: row?.parentId || "" }); setEditing(row?._id || "new"); setDirty(false);
    } catch (err) { setError(err.message); }
  }
  function payload() {
    const data = { ...form, displayOrder: Number(form.displayOrder), parentId: form.parentId || null, filterRules: { ...form.filterRules, tagIds: ruleTags.map(t => t._id), categoryIds: ruleCategories.map(c => c._id) } };
    if (section === "categories") data.parentId = null;
    return data;
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (section === "subcategories" && !form.parentId) throw new Error("Select a main category.");
      const row = await taxonomyRequest(`${resource}${editing === "new" ? "" : `/${editing}`}`, payload(), editing === "new" ? "POST" : "PATCH");
      setForm({ ...empty, ...row }); setEditing(row._id); setDirty(false); setNotice("Saved successfully."); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(`Delete ${form.name}${reassign ? " and reassign its prompts" : ""}?`)) return;
    setBusy(true);
    try { await taxonomyRequest(`${resource}/${editing}`, { reassignTo: reassign || undefined }, "DELETE"); setEditing(null); setDirty(false); setNotice("Deleted successfully."); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData(); body.set("sampleOutputFile", file);
      const response = await fetch("/api/admin/taxonomy/media", { method: "POST", body }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      update(resource === "categories" ? "image" : "coverImage", result.value);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const singular = section === "subcategories" ? "subcategory" : resource === "categories" ? "category" : resource.slice(0, -1);
  const title = sections[section];
  const descriptions = {
    categories: "Organize the main categories visitors explore on Discover.",
    subcategories: "Make prompts easier to find within each main category.",
    tags: "Manage reusable labels for prompt discovery and collections.",
    collections: "Curate prompts manually or bring them together with matching rules.",
    migration: "Review proposed classifications before applying changes to existing prompts.",
    bulk: "Filter prompts and manage selected taxonomy assignments together.",
  };
  const total = Number(result.pagination?.total || 0);
  const pages = Math.max(Number(result.pagination?.pages || 1), 1);
  const image = resource === "categories" ? form.image : form.coverImage;
  const closeEditor = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setEditing(null); setDirty(false); setError("");
  };
  const badge = value => <span className={`status-badge ${value === "active" ? "status-badge-success" : "status-badge-muted"}`}>{value}</span>;
  const thumbnail = row => row.image || row.coverImage
    ? <img className="taxonomy-record-image" src={row.image || row.coverImage} alt="" loading="lazy" />
    : <span className="taxonomy-record-placeholder" aria-hidden="true">{row.name?.slice(0, 2).toUpperCase() || "—"}</span>;

  return <div className="stack admin-taxonomy-page">
    <div className="taxonomy-page-heading">
      <div><p className="taxonomy-eyebrow">Taxonomy</p><h2>{title}</h2><p className="muted">{descriptions[section]}</p></div>
      {!["migration", "bulk"].includes(section) && !editing ? <button className="button" type="button" onClick={() => edit(null)}>Create {singular}</button> : null}
    </div>
    <nav className="admin-tabs taxonomy-section-tabs" aria-label="Taxonomy sections">
      {Object.entries(sections).map(([key, label]) => <Link className={`button-secondary compact${key === section ? " active" : ""}`} aria-current={key === section ? "page" : undefined} key={key} href={`/admin/taxonomy/${key}`}>{label}</Link>)}
    </nav>
    <UnsavedWarning dirty={dirty} />
    {section === "migration" ? <AdminTaxonomyMigration /> : section === "bulk" ? <AdminTaxonomyPrompts /> : <>
      {!editing && error ? <div className="taxonomy-notice taxonomy-notice-error" role="alert">{error}</div> : null}
      {!editing && notice ? <div className="taxonomy-notice taxonomy-notice-success" role="status">{notice}</div> : null}
      {!editing ? <>
        <div className="admin-toolbar taxonomy-toolbar">
          <label className="field taxonomy-search">Search<input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}…`} /></label>
          <label className="field">Status<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          {resource === "tags" ? <label className="field">Tag type filter<select value={tagType} onChange={e => { setTagType(e.target.value); setPage(1); }}><option value="">All types</option>{types.map(v => <option key={v}>{v}</option>)}</select></label> : null}
          {q || status || parent || tagType ? <button className="button-secondary compact" type="button" onClick={() => { setQ(""); setStatus(""); setParent(""); setTagType(""); setPage(1); }}>Reset filters</button> : null}
        </div>
        {section === "subcategories" ? <div className="panel form-card taxonomy-parent-filter"><TaxonomySelect label="Filter main category" resource="categories" parentId="null" active={false} value={parent} onChange={v => { setParent(v); setPage(1); }} /></div> : null}
        {resource === "tags" ? <details className="panel form-card taxonomy-disclosure"><summary>Configure tag types</summary><form className="stack" onSubmit={async e => { e.preventDefault(); try { const value = new FormData(e.currentTarget).get("types"); const result = await taxonomyRequest("config", { tagTypes: value.split(",").map(v => v.trim()).filter(Boolean) }, "PATCH"); setTypes(result.tagTypes); setNotice("Tag types saved."); } catch (err) { setError(err.message); } }}><label className="field">Comma-separated types<input name="types" defaultValue={types.join(", ")} /></label><div><button className="button compact">Save types</button></div></form></details> : null}
        <section className="panel form-card taxonomy-list-panel" aria-label={`${title} records`} aria-busy={loading}>
          <div className="section-header taxonomy-list-heading"><div><strong>{total.toLocaleString("en-IN")}</strong> <span className="muted">{title.toLowerCase()}</span></div>{loading ? <span className="muted" role="status">Loading…</span> : <span className="muted taxonomy-page-count">Page {page} of {pages}</span>}</div>
          <div className="table-wrap taxonomy-table-wrap"><table className="table taxonomy-table"><thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Prompts</th><th>{resource === "tags" ? "Tag type" : "Order"}</th><th className="taxonomy-actions-cell">Actions</th></tr></thead>
            <tbody>{result.data.map(row => <tr key={row._id} className={editing === row._id ? "taxonomy-selected-row" : ""}>
              <td><div className="taxonomy-record-summary">{thumbnail(row)}<div><strong>{row.name}</strong>{row.description ? <p>{row.description}</p> : null}{resource === "collections" ? <span className="taxonomy-record-type">{row.collectionType}</span> : null}</div></div></td>
              <td><code className="taxonomy-slug">{row.slug}</code></td><td>{badge(row.status)}</td><td><span className="taxonomy-count">{Number(row.promptCount || 0).toLocaleString("en-IN")}</span></td><td>{resource === "tags" ? row.tagType || "General" : row.displayOrder ?? "—"}</td>
              <td className="taxonomy-actions-cell"><button className="button-secondary compact" type="button" aria-label={`Edit ${row.name}`} onClick={() => edit(row)}>Edit</button></td>
            </tr>)}</tbody>
          </table></div>
          <div className="admin-card-list taxonomy-mobile-list">{result.data.map(row => <article className="admin-prompt-card" key={row._id}><div className="taxonomy-record-summary">{thumbnail(row)}<div><strong>{row.name}</strong><code className="taxonomy-slug">{row.slug}</code></div></div><div className="admin-card-meta">{badge(row.status)}<span>{Number(row.promptCount || 0)} prompts</span><span>{resource === "tags" ? row.tagType || "General" : `Order ${row.displayOrder ?? 0}`}</span></div><button className="button-secondary compact" type="button" aria-label={`Edit ${row.name}`} onClick={() => edit(row)}>Edit</button></article>)}</div>
          {!loading && !result.data.length ? <div className="empty-state"><h3>No {title.toLowerCase()} found</h3><p className="muted">{q || status || parent || tagType ? "Try another search or reset your filters." : `Create your first ${singular} to get started.`}</p></div> : null}
          <nav className="admin-pagination" aria-label={`${title} pages`}><button className="button-secondary compact" type="button" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button-secondary compact" type="button" disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Next</button></nav>
        </section>
      </> : null}

      {editing ? <form className="panel form-card stack taxonomy-editor" onSubmit={save}>
        <div className="taxonomy-editor-heading"><div><p className="taxonomy-eyebrow">{editing === "new" ? "New record" : "Edit record"}</p><h2>{editing === "new" ? `Create ${singular}` : form.name}</h2></div><button className="button-secondary compact" disabled={busy} type="button" onClick={closeEditor}>Back to {title.toLowerCase()}</button></div>
        <fieldset className="taxonomy-editor-fields" disabled={busy}>
          <section className="taxonomy-form-section"><div className="taxonomy-form-section-heading"><h3>Basic details</h3><p>The name and description shown in your library.</p></div>
            <div className="form-grid"><label className="field">Name<input required maxLength={120} placeholder={`Enter ${singular} name`} value={form.name} onChange={e => update("name", e.target.value)} /></label><label className="field">Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={140} placeholder="e.g. personal-lifestyle" value={form.slug} onChange={e => update("slug", e.target.value)} /><span className="field-hint">Use lowercase letters, numbers, and hyphens.</span></label></div>
            <label className="field">Description<textarea rows={3} maxLength={1000} placeholder={`Describe this ${singular}…`} value={form.description} onChange={e => update("description", e.target.value)} /></label>
            {section === "subcategories" ? <TaxonomySelect resource="categories" label="Parent main category" parentId="null" active={false} required value={form.parentId} onChange={v => update("parentId", v)} /> : null}
          </section>
          <section className="taxonomy-form-section"><div className="taxonomy-form-section-heading"><h3>Visibility & organization</h3><p>Choose availability and how this record is organized.</p></div><div className="form-grid">
            <label className="field">Status<select value={form.status} onChange={e => update("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            {resource === "tags" ? <label className="field">Tag type<select value={form.tagType} onChange={e => update("tagType", e.target.value)}>{types.map(v => <option key={v}>{v}</option>)}</select></label> : <label className="field">Display order<input type="number" min="0" step="1" required value={form.displayOrder} onChange={e => update("displayOrder", e.target.value)} /><span className="field-hint">Lower numbers appear first.</span></label>}
          </div></section>
          {resource !== "tags" ? <>
            <section className="taxonomy-form-section"><div className="taxonomy-form-section-heading"><h3>{resource === "categories" ? "Category image" : "Cover image"}</h3><p>Add artwork to help visitors recognize this {singular}.</p></div><div className="taxonomy-media-grid">
              <div className={`taxonomy-image-preview${image ? " has-image" : ""}`}>{image ? <img src={image} alt={`${form.name || singular} preview`} /> : <span>No image selected</span>}</div>
              <div className="stack"><label className="field">{resource === "categories" ? "Category image" : "Cover image"} URL<input type="url" placeholder="https://…" value={image} onChange={e => update(resource === "categories" ? "image" : "coverImage", e.target.value)} /></label><label className="field taxonomy-upload">Upload image<input type="file" accept="image/*" onChange={e => upload(e.target.files[0])} /><span className="field-hint">Choose an image, then save the record to apply it.</span></label>{image ? <div><button className="button-secondary compact" type="button" onClick={() => update(resource === "categories" ? "image" : "coverImage", "")}>Remove image</button></div> : null}</div>
            </div>{resource === "categories" ? <label className="field taxonomy-icon-field">Icon<input maxLength={120} value={form.icon} onChange={e => update("icon", e.target.value)} placeholder="Optional icon name" /></label> : null}</section>

          </> : null}
            <section className="taxonomy-form-section"><div className="taxonomy-form-section-heading"><h3>Search appearance</h3><p>Optional title and description for search engines.</p></div><div className="form-grid"><label className="field">SEO title<input maxLength={70} value={form.seoTitle} onChange={e => update("seoTitle", e.target.value)} /><span className="field-hint">Up to 70 characters.</span></label><label className="field">SEO description<textarea rows={3} maxLength={180} value={form.seoDescription} onChange={e => update("seoDescription", e.target.value)} /><span className="field-hint">Up to 180 characters.</span></label></div></section>
          {resource === "collections" ? <section className="taxonomy-form-section"><div className="taxonomy-form-section-heading"><h3>Collection rules</h3><p>Choose manual selection, automatic matching, or a combination of both.</p></div><div className="form-grid"><label className="field">Collection type<select value={form.collectionType} onChange={e => update("collectionType", e.target.value)}><option value="manual">Manual</option><option value="dynamic">Dynamic</option><option value="hybrid">Hybrid</option></select></label>
            {form.collectionType !== "manual" ? <label className="field">Tag matching<select value={form.filterRules.match} onChange={e => update("filterRules", { ...form.filterRules, match: e.target.value })}><option value="any">ANY tags</option><option value="all">ALL tags</option></select></label> : null}</div>
            {form.collectionType !== "manual" ? <div className="form-grid"><TagPicker value={ruleTags} onChange={v => { setRuleTags(v); setDirty(true); }} /><TaxonomySelect resource="categories" label="Category / subcategory filters" multiple selected={ruleCategories} onChange={v => { setRuleCategories(v); setDirty(true); }} /></div> : null}
            {editing !== "new" ? <div><button className="button-secondary compact" type="button" onClick={async () => { try { setPreview(await taxonomyRequest(`collections/${editing}/preview`, payload())); } catch (err) { setError(err.message); } }}>Preview these rules</button></div> : <p className="field-hint">Save to preview matching prompts.</p>}
            {preview ? <div className="taxonomy-rule-preview"><strong>{preview.pagination.total} matching prompts</strong>{preview.data.map(p => <p key={p._id}>{p.title}</p>)}</div> : null}
          </section> : null}
          {editing !== "new" ? <details className="taxonomy-record-details"><summary>Record details</summary><dl><div><dt>ID</dt><dd>{editing}</dd></div><div><dt>Created</dt><dd>{form.createdAt || "—"}</dd></div><div><dt>Updated</dt><dd>{form.updatedAt || "—"}</dd></div></dl></details> : null}
          {error ? <div className="taxonomy-notice taxonomy-notice-error" role="alert">{error}</div> : null}
          {notice ? <div className="taxonomy-notice taxonomy-notice-success" role="status">{notice}</div> : null}
          <div className="taxonomy-form-actions"><span className="muted">{dirty ? "You have unsaved changes." : editing === "new" ? "Complete the details, then save." : "All changes saved."}</span><div className="pill-row"><button className="button-secondary" type="button" onClick={closeEditor}>Cancel</button><button className="button" type="submit">{busy ? "Saving…" : "Save"}</button></div></div>
          {editing !== "new" ? <details className="taxonomy-danger-zone"><summary>Delete / merge</summary><p className="muted">Review references before deleting a record. Deleting a category with prompts requires reassignment.</p>
            {resource === "categories" ? <TaxonomySelect label="Reassign prompts before deletion" resource="categories" value={reassign} onChange={setReassign} /> : null}
            {resource === "tags" ? <div className="stack"><TaxonomySelect label="Merge into tag" resource="tags" value={mergeTarget} onChange={setMergeTarget} /><div><button className="button-secondary compact" disabled={!mergeTarget || mergeTarget === editing} type="button" onClick={async () => { if (!window.confirm("Merge this tag, preserving all prompt and collection relationships?")) return; setBusy(true); try { await taxonomyRequest(`tags/${editing}/merge`, { targetId: mergeTarget }); setEditing(null); setDirty(false); setNotice("Tags merged."); await load(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>Merge tag</button></div></div> : null}
            <button className="button-danger compact" type="button" onClick={remove}>Delete {form.name}</button>
          </details> : null}
        </fieldset>
      </form> : null}
      {resource === "collections" && editing && editing !== "new" ? <CollectionMembers key={`${editing}-${form.updatedAt}`} collection={form} /> : null}
    </>}
  </div>;
}
