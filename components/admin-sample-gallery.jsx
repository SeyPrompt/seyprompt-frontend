"use client";
import { useRef, useState } from 'react';
const LIMIT = 10, MAX_BYTES = 10 * 1024 * 1024;
export default function AdminSampleGallery({ value, onChange, onBusyChange, legacySample, previewUrls = [], isExternal = false }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [url, setUrl] = useState('');
  const dragging = useRef(null);
  const images = value.images;
  function commit(next, patch = {}) {
    onChange({ ...value, images: next, coverId: next.some(row => row.id === value.coverId) ? value.coverId : next[0]?.id || '', ...(!next.length ? { mode: 'single' } : {}), ...patch });
  }
  function move(from, to) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images], [item] = next.splice(from, 1); next.splice(to, 0, item); commit(next);
  }
  function update(id, field, nextValue) { commit(images.map(image => image.id === id ? { ...image, [field]: nextValue } : image)); }
  function importLegacy() {
    if (!legacySample?.value || images.length >= LIMIT) return;
    const image = { ...legacySample, id: crypto.randomUUID(), altText: '', caption: '', instructions: '' };
    if (!Number.isFinite(image.bytes)) delete image.bytes;
    commit([...images, image]);
  }
  async function upload(files) {
    if (busy || !files.length) return;
    setError('');
    if (files.length + images.length > LIMIT) { setError('A prompt can have up to 10 sample images.'); return; }
    if (files.some(file => !file.type.startsWith('image/') || file.size > MAX_BYTES)) { setError('Choose image files up to 10 MB each.'); return; }
    setBusy(true); onBusyChange(true);
    let next = [...images];
    try {
      for (const file of files) {
        const body = new FormData(); body.set('sampleOutputFile', file);
        if (isExternal) body.set('listingType', 'external');
        const response = await fetch('/api/admin/taxonomy/media', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Image upload failed.');
        next = [...next, { ...result, id: crypto.randomUUID(), altText: '', caption: '', instructions: '' }];
        commit(next);
      }
    } catch (err) { setError(`${err.message} Successfully uploaded images are kept in this form; save to attach them.`); }
    finally { setBusy(false); onBusyChange(false); }
  }
  function addUrl() {
    setError('');
    try {
      const imageUrl = new URL(url.trim());
      if (imageUrl.protocol !== 'https:' || imageUrl.username || imageUrl.password || images.length >= LIMIT) throw new Error('Use an HTTPS image URL; at most 10 images.');
      commit([...images, { id: crypto.randomUUID(), type: 'image', value: imageUrl.toString(), fileName: '', altText: '', caption: '', instructions: '' }]); setUrl('');
    } catch (err) { setError(err.message || 'Enter a valid HTTPS image URL.'); }
  }
  return <fieldset className="admin-gallery" disabled={busy} onDragOver={event => event.preventDefault()} onDrop={event => { if (event.dataTransfer.files.length) { event.preventDefault(); upload([...event.dataTransfer.files]); } }}>
    <legend>Sample image gallery</legend>
    <p>Add up to 10 images. Drag cards or use the arrow buttons to reorder. The cover appears first on Discover and in sharing previews.</p>
    {!isExternal && <>
      <label className="field">Prompt arrangement<select value={value.mode} onChange={event => commit(images, { mode: event.target.value })}><option value="single">One shared prompt for all samples</option><option value="per-image">Prompt set — instructions for each image</option></select></label>
      <p className="field-hint">{value.mode === 'single' ? 'Use the main prompt for all examples, or describe numbered outputs such as front, back, detail, flat lay and lifestyle. Some AI tools generate these one at a time.' : 'The main prompt supplies shared context. Add instructions to every image below; users can copy the shared context and selected image instructions together.'}</p>
    </>}
    {legacySample?.type === 'image' && legacySample.value && !images.some(row => row.value === legacySample.value) ? <div><button className="button-secondary compact" type="button" disabled={images.length >= LIMIT} onClick={importLegacy}>Add current single sample to gallery</button></div> : null}
    <label className="field admin-gallery-drop">Upload images or drop them here<input type="file" multiple accept="image/*" onChange={event => { const files = [...event.target.files]; event.target.value = ''; upload(files); }} disabled={images.length >= LIMIT || busy} /></label>
    <div className="field"><label htmlFor="gallery-image-url">Add an existing image URL</label><div className="pill-row"><input id="gallery-image-url" type="url" value={url} placeholder="https://…" onChange={event => setUrl(event.target.value)} /><button type="button" className="button-secondary compact" disabled={!url.trim() || images.length >= LIMIT} onClick={addUrl}>Add image URL</button></div></div>
    <p role="status">{busy ? 'Uploading images… Please wait before saving.' : `${images.length} / ${LIMIT} images`}</p>
    {error ? <p role="alert" className="error-text">{error}</p> : null}
    <div className="admin-gallery-grid">{images.map((image, index) => <article className="admin-gallery-item" key={image.id} draggable={!busy} onDragStart={event => { dragging.current = image.id; event.dataTransfer.setData('text/plain', image.id); }} onDragEnd={() => { dragging.current = null; }} onDrop={event => { if (dragging.current) { event.preventDefault(); event.stopPropagation(); move(images.findIndex(row => row.id === dragging.current), index); dragging.current = null; } }}>
      {previewUrls[index] ? <img src={previewUrls[index]} alt={image.altText || `Gallery sample ${index + 1}`} draggable={false} /> : null}
      <div className="admin-gallery-actions"><strong>Sample {index + 1}</strong><label><input type="radio" name="gallery-cover" checked={value.coverId === image.id} onChange={() => commit(images, { coverId: image.id })} /> Cover</label><button type="button" className="button-secondary compact" aria-label={`Move sample ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button><button type="button" className="button-secondary compact" aria-label={`Move sample ${index + 1} down`} disabled={index === images.length - 1} onClick={() => move(index, index + 1)}>↓</button><button type="button" className="button-secondary compact" aria-label={`Remove sample ${index + 1}`} onClick={() => commit(images.filter(row => row.id !== image.id))}>Remove</button></div>
      <label className="field">Alt text<input maxLength={180} value={image.altText || ''} onChange={event => update(image.id, 'altText', event.target.value)} placeholder="Describe this image for accessibility" /></label>
      <label className="field">Caption<input maxLength={300} value={image.caption || ''} onChange={event => update(image.id, 'caption', event.target.value)} placeholder="For example: rear view or lifestyle scene" /></label>
      {!isExternal && value.mode === 'per-image' ? <label className="field">Instructions for this image<textarea required rows={5} maxLength={10000} value={image.instructions || ''} onChange={event => update(image.id, 'instructions', event.target.value)} placeholder="Describe this image's output. Shared instructions come from the main prompt." /></label> : null}
    </article>)}</div>
    <p className="field-hint">Removing an image detaches it when you save. Its uploaded file is retained to protect any other prompts using it. With an empty gallery, the single sample below continues to work.</p>
  </fieldset>;
}
