"use client";
import { useEffect, useState } from "react";
import { TagPicker, TaxonomySelect, taxonomyRequest } from "./admin-taxonomy-controls";

export default function AdminPromptTaxonomy({ prompt, onChange }) {
  const [main, setMain] = useState(""); const [sub, setSub] = useState("");
  const [tags, setTags] = useState([]); const [matching, setMatching] = useState([]);
  const [manual, setManual] = useState([]); const [error, setError] = useState("");
  const [secondary, setSecondary] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [category, loadedTags, members, placements] = await Promise.all([
          prompt?.categoryId ? taxonomyRequest(`categories/${prompt.categoryId}`) : null,
          Promise.all((prompt?.tagIds || []).map(id => taxonomyRequest(`tags/${id}`))),
          prompt?._id ? taxonomyRequest(`prompts/${prompt._id}/collections`) : { data: [] },
          Promise.all((prompt?.secondaryCategoryIds || []).map(id => taxonomyRequest(`categories/${id}`)))
        ]);
        if (!active) return;
        const mainId = category?.parentId || category?._id || "";
        const subId = category?.parentId ? category._id : "";
        setMain(mainId); setSub(subId); setTags(loadedTags); setManual(members.data); setSecondary(placements);
        onChange({ secondaryCategoryIds: placements.map(c => c._id), categoryId: subId || mainId, tagIds: loadedTags.map(t => t._id), manualCollectionIds: members.data.map(c => c._id) });
        setReady(true);
      } catch (err) { if (active) setError(err.message); }
    }
    load(); return () => { active = false; };
  }, [prompt, onChange]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    taxonomyRequest("matching-collections", { categoryId: sub || main, secondaryCategoryIds: secondary.map(c => c._id), tagIds: tags.map(t => t._id) }).then(r => { if (active) setMatching(r.data); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [main, sub, tags, secondary, ready]);
  function update(nextMain, nextSub, nextTags, nextManual = manual, nextSecondary = secondary) {
    setMain(nextMain); setSub(nextSub); setTags(nextTags); setManual(nextManual);
    const placements = nextSecondary.filter(c => c._id !== (nextSub || nextMain)); setSecondary(placements);
    onChange({ secondaryCategoryIds: placements.map(c => c._id), categoryId: nextSub || nextMain, tagIds: nextTags.map(t => t._id), manualCollectionIds: nextManual.map(c => c._id) }, true);
  }
  return <fieldset className="stack" disabled={!ready}><legend>Prompt taxonomy</legend>
    {error ? <p role="alert">{error}</p> : null}{!ready ? <p role="status">Loading taxonomy…</p> : null}
    <TaxonomySelect resource="categories" label="Main category" parentId="null" required value={main} onChange={v => update(v, "", tags)} />
    {main ? <TaxonomySelect key={main} resource="categories" label="Subcategory" parentId={main} value={sub} onChange={v => update(main, v, tags)} /> : null}
    <TaxonomySelect resource="categories" label="Also show in" multiple selected={secondary} onChange={v => update(main, sub, tags, manual, v)} />
    <div className="pill-row" aria-label="Additional category placements">{secondary.map(category => <button className="pill" type="button" key={category._id} aria-label={`Remove additional placement ${category.name}`} onClick={() => update(main, sub, tags, manual, secondary.filter(c => c._id !== category._id))}>{category.name} ×</button>)}</div>
    <p className="field-hint">Hold Ctrl or Command to select multiple options. Choose additional categories or subcategories. There is no two-category limit. The primary category controls breadcrumbs; each prompt appears only once in matching results.</p>
    <TagPicker value={tags} onChange={v => update(main, sub, v)} />
    {prompt?.tags?.length ? <p className="muted">Existing tags are preserved during classification: {prompt.tags.join(", ")}</p> : null}
    <TaxonomySelect resource="collections" collectionType="manual" label="Manual collections" multiple selected={manual} onChange={v => update(main, sub, tags, v.filter(c => c.collectionType === "manual"))} />
    <p>Automatic collections: {matching.map(c => c.name).join(", ") || "No matches"}</p>
  </fieldset>;
}
