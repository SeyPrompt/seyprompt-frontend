"use client";
import { useEffect, useState } from "react";

export async function taxonomyRequest(path, body, method = "POST") {
  const response = await fetch(`/api/admin/taxonomy/${path}`, body === undefined ? { cache: "no-store" } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Taxonomy request failed.");
  return data;
}

// Search and pagination stay on the backend even for select controls.
export function TaxonomySelect({ resource, label, value = "", onChange, parentId, multiple = false, selected = [], active = true, required = false, collectionType }) {
  const [q, setQ] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  useEffect(() => {
    if (multiple || !value) { setSelectedRecord(null); return; }
    let current = true;
    taxonomyRequest(`${resource}/${value}`).then(row => { if (current) setSelectedRecord(row); }).catch(() => {});
    return () => { current = false; };
  }, [multiple, resource, value]);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      const params = new URLSearchParams({ q, page: String(page), limit: "25", ...(collectionType ? { collectionType } : {}), ...(active ? { status: "active" } : {}), ...(parentId !== undefined ? { parentId } : {}) });
      try {
        const response = await fetch(`/api/admin/taxonomy/${resource}?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load options.");
        setResult(data);
      } catch (err) { if (err.name !== "AbortError") setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [resource, q, page, active, parentId, collectionType]);
  const values = multiple ? selected : value ? [selectedRecord?._id === value ? selectedRecord : { _id: value, name: value }] : [];
  const options = [...result.data];
  values.forEach(row => { if (!options.some(v => v._id === row._id)) options.unshift(row); });
  return <div className="field">
    <label>{label}<input aria-label={`Search ${label}`} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${label.toLowerCase()}`} /></label>
    {loading ? <span className="field-hint" role="status">Loading options…</span> : null}
    {error ? <span className="error-text" role="alert">{error}</span> : null}
    <select aria-label={label} multiple={multiple} required={required} value={multiple ? selected.map(v => v._id) : value} onChange={e => multiple ? onChange([...e.target.selectedOptions].map(o => options.find(v => v._id === o.value)).filter(Boolean)) : onChange(e.target.value, options.find(v => v._id === e.target.value))}>
      {!multiple ? <option value="">Select {label.toLowerCase()}</option> : null}
      {options.map(row => <option key={row._id} value={row._id}>{row.name}{row.status === "inactive" ? " (inactive)" : ""}</option>)}
    </select>
    {result.pagination?.pages > 1 ? <div className="pill-row"><button className="button-secondary compact" type="button" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous options</button><span className="field-hint">Page {page}</span><button className="button-secondary compact" type="button" disabled={page >= (result.pagination?.pages || 1) || loading} onClick={() => setPage(p => p + 1)}>Next options</button></div> : null}
  </div>;
}

export function TagPicker({ value, onChange, allowCreate = true }) {
  const [q, setQ] = useState(""); const [error, setError] = useState("");
  const [options, setOptions] = useState([]); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/taxonomy/tags?status=active&limit=20&q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load tags.");
        setOptions(result.data); setError("");
      } catch (err) { if (err.name !== "AbortError") setError(err.message); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);
  function add(tag) { if (!value.some(t => t._id === tag._id)) onChange([...value, tag]); setQ(""); }
  async function create() {
    setBusy(true);
    try { add(await taxonomyRequest("tags", { name: q.trim(), slug: q.trim().normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), tagType: "General" })); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="field"><label htmlFor="taxonomy-tag-search">Tags</label>
    <input id="taxonomy-tag-search" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const first = options.find(t => !value.some(v => v._id === t._id)); if (first) add(first); } }} placeholder="Search tags; Enter adds the first result" />
    <div className="pill-row">{value.map(tag => <button className="pill" type="button" key={tag._id} onClick={() => onChange(value.filter(v => v._id !== tag._id))} aria-label={`Remove tag ${tag.name}`}>{tag.name} ×</button>)}</div>
    <div className="pill-row" aria-label="Matching tags">{options.filter(t => !value.some(v => v._id === t._id)).map(tag => <button className="button-secondary compact" type="button" key={tag._id} onClick={() => add(tag)}>{tag.name}</button>)}</div>
    {allowCreate && q.trim() && !options.some(t => t.name.toLowerCase() === q.trim().toLowerCase()) ? <button className="button-secondary compact" type="button" disabled={busy} onClick={create}>Create tag “{q.trim()}”</button> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}

export function UnsavedWarning({ dirty }) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = e => { e.preventDefault(); e.returnValue = ""; };
    const click = e => { const a = e.target.closest("a[href]"); if (a && !a.target && !window.confirm("Discard unsaved changes?")) { e.preventDefault(); e.stopPropagation(); } };
    window.addEventListener("beforeunload", beforeUnload); document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", click, true); };
  }, [dirty]);
  return null;
}
