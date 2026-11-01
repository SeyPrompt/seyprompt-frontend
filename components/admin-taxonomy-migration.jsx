"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TaxonomySelect, taxonomyRequest } from "./admin-taxonomy-controls";

export default function AdminTaxonomyMigration() {
  const [runId, setRunId] = useState(""); const [after, setAfter] = useState(null);
  const [page, setPage] = useState(1); const [state, setState] = useState("pending");
  const [result, setResult] = useState({ data: [], summary: [], pagination: {} });
  const [selected, setSelected] = useState([]); const [overrides, setOverrides] = useState({}); const [editing, setEditing] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const stop = useRef(false);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("runId");
    let saved;
    try { saved = JSON.parse(localStorage.getItem("taxonomy-review-run") || "null"); } catch { saved = null; }
    setRunId(fromUrl || saved?.runId || ""); if (!fromUrl) setAfter(saved?.after || null);
    return () => { stop.current = true; };
  }, []);
  const load = useCallback(async () => {
    if (!runId) return;
    try { setResult(await taxonomyRequest(`migration/status?${new URLSearchParams({ runId, page: String(page), state, limit: "25" })}`)); setSelected([]); }
    catch (err) { setError(err.message); }
  }, [runId, page, state]);
  useEffect(() => { load(); }, [load]);
  async function analyze(fresh = false) {
    setBusy(true); setError(""); stop.current = false;
    let currentRun = fresh ? undefined : runId || undefined, cursor = fresh ? null : after;
    try {
      let more = true;
      while (more && !stop.current) {
        const r = await taxonomyRequest("migration/preview", { runId: currentRun, after: cursor, limit: 100 });
        currentRun = r.runId; cursor = r.after; more = r.hasMore;
        setRunId(currentRun); setAfter(cursor);
        localStorage.setItem("taxonomy-review-run", JSON.stringify({ runId: currentRun, after: cursor }));
        setNotice(`Analyzed ${r.analyzed} prompts in the latest batch. ${more ? "Continuing…" : "Analysis complete; review proposals below."}`);
      }
      setPage(1);
      const r = await taxonomyRequest(`migration/status?${new URLSearchParams({ runId: currentRun, state, page: "1", limit: "25" })}`); setResult(r);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function apply(rollback = false) {
    if (!window.confirm(rollback ? `Roll back ${selected.length} selected mappings? Later taxonomy edits will block rollback.` : `Approve ${selected.length} selected mappings? Uncertain suggestions require your review.`)) return;
    setBusy(true); setError("");
    try {
      const body = rollback ? { runId, confirm: true, reviewIds: selected } : { runId, confirm: true, approvals: selected.map(reviewId => ({ reviewId, ...(overrides[reviewId] ? { categoryId: overrides[reviewId] } : {}) })) };
      const r = await taxonomyRequest(`migration/${rollback ? "rollback" : "apply"}`, body); setNotice(JSON.stringify(r)); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function exportRun() {
    setBusy(true);
    try {
      let p = 1, rows = [], more = true;
      while (more) {
        const r = await taxonomyRequest(`migration/status?${new URLSearchParams({ runId, page: String(p), limit: "100" })}`);
        rows = rows.concat(r.data); more = p < r.pagination.pages; p++;
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify({ runId, exportedAt: new Date().toISOString(), rows }, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `taxonomy-${runId}.json`; a.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const totals = result.summary.reduce((v, s) => ({ ...v, analyzed: v.analyzed + s.count, applied: v.applied + (s._id.state === "applied" ? s.count : 0), review: v.review + (s._id.state === "pending" ? s.count : 0) }), { analyzed: 0, applied: 0, review: 0 });
  return <section className="panel form-card stack"><h2>Existing prompt classification</h2>
    <p>Analysis proposes assignments without changing prompts. Review each proposal and approve selected rows. Applying a batch stores original relationships in the database before writing. Rollback refuses to overwrite subsequent taxonomy changes.</p>
    <div className="pill-row"><button type="button" disabled={busy} onClick={() => analyze(true)}>New dry run of all prompts</button><button type="button" disabled={busy || !runId} onClick={() => analyze()}>Resume analysis</button>{busy ? <button type="button" onClick={() => { stop.current = true; }}>Stop after batch</button> : null}<button type="button" disabled={busy || !runId} onClick={exportRun}>Export report / backups</button></div>
    <label className="field">Run ID<input value={runId} onChange={e => { setRunId(e.target.value); setAfter(null); setPage(1); }} /></label>
    <p>{totals.analyzed} analyzed · {totals.applied} applied · {totals.review} pending review</p>
    <label className="field">Review state<select value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="pending">Pending</option><option value="applied">Applied</option><option value="rolled-back">Rolled back</option></select></label>
    {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}{busy ? <p role="status">Working…</p> : null}
    <div className="table-wrap"><table className="table"><thead><tr><th>Approve</th><th>Prompt</th><th>Confidence / reason</th><th>Proposed category</th><th>Override</th></tr></thead><tbody>{result.data.map(row => <tr key={row._id}><td><input type="checkbox" aria-label={`Select mapping for ${row.title}`} checked={selected.includes(row._id)} disabled={busy || state === "rolled-back"} onChange={e => setSelected(v => e.target.checked ? [...v, row._id] : v.filter(id => id !== row._id))} /></td><td>{row.title}</td><td>{row.confidence}<p>{row.reason}</p></td><td>{row.proposedCategoryName || row.proposedCategoryId || "Manual choice required"}{overrides[row._id] ? <p>Override selected</p> : null}</td><td>{state === "pending" ? <button type="button" onClick={() => setEditing(row._id)}>Choose category</button> : row.state}</td></tr>)}</tbody></table></div>
    {!result.data.length ? <p>No review rows in this view.</p> : null}
    {editing ? <div className="panel form-card"><TaxonomySelect resource="categories" label="Category override" value={overrides[editing] || ""} onChange={v => setOverrides(o => ({ ...o, [editing]: v }))} /><button type="button" onClick={() => setEditing("")}>Done</button></div> : null}
    <div className="pill-row"><button type="button" disabled={busy || !selected.length || state === "rolled-back"} onClick={() => apply(state === "applied")}>{state === "applied" ? "Rollback selected" : "Approve and apply selected"}</button><button type="button" disabled={page === 1 || busy} onClick={() => setPage(v => v - 1)}>Previous</button><span>Page {page} of {result.pagination.pages || 1}</span><button type="button" disabled={page >= (result.pagination.pages || 1) || busy} onClick={() => setPage(v => v + 1)}>Next</button></div>
  </section>;
}
