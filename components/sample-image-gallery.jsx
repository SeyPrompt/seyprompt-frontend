"use client";
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut, Expand } from 'lucide-react';
import { ProtectedImage } from './protected-media';
import { PromptAccessLink } from './PromptAccessLink';
import { CopyButton } from './CopyButton';
import { getSampleImages, getCoverIndex, imagePromptText, sampleImageUrl } from '@/lib/sample-images';

function GalleryImage({ image, title, index, large = false, ...props }) {
  const [failedUrl, setFailedUrl] = useState('');
  const url = sampleImageUrl(image);
  return failedUrl === url ? <span className="gallery-unavailable" role="status">This sample is temporarily unavailable. Try another image.</span> : <ProtectedImage alt={image.altText || image.caption || `${title} — sample ${index + 1}`} src={url} loading={large ? 'eager' : 'lazy'} cloudinaryOptions={{ crop: 'limit' }} width={large ? 1600 : 720} widths={large ? [960, 1440, 1920] : [240, 480, 720]} sizes={large ? '(max-width: 760px) 95vw, 85vw' : '(max-width: 760px) 50vw, 320px'} onError={() => setFailedUrl(url)} {...props} />;
}
export function SampleCollage({ prompt }) {
  const images = getSampleImages(prompt), cover = getCoverIndex(prompt, images);
  if (!images.length) return null;
  const order = [images[cover], ...images.filter((_, index) => index !== cover)];
  const remaining = order.slice(1, 4);
  return <span className="sample-collage"><span className="sample-collage-cover"><GalleryImage key={order[0]?.id} image={order[0]} title={prompt.title} index={cover} /><span className="sample-collage-count">{images.length} images{prompt.samplePromptMode === "per-image" ? " · Set" : ""}</span></span>
    <span className={`sample-collage-strip count-${remaining.length}`}>{remaining.map((image, index) => <span className="sample-collage-tile" key={image.id}><GalleryImage image={image} title={prompt.title} index={index + 1} />{index === remaining.length - 1 && images.length > 4 ? <span className="sample-collage-more">+{images.length - 4} more</span> : null}</span>)}</span>
  </span>;
}
export function GalleryLightbox({ prompt, images, index, setIndex, open, onClose, showPromptLink = false }) {
  const [zoom, setZoom] = useState(false);
  const dialog = useRef(null), close = useRef(null), touch = useRef(null);
  const safeIndex = Math.min(index, images.length - 1), image = images[safeIndex];
  const move = delta => { setIndex((safeIndex + delta + images.length) % images.length); setZoom(false); };
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; close.current?.focus();
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(value => (value - 1 + images.length) % images.length); setZoom(false); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setIndex(value => (value + 1) % images.length); setZoom(false); }
      if (event.key === 'Tab') {
        const nodes = [...(dialog.current?.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]') || [])];
        const first = nodes[0], last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); setZoom(false); };
  }, [open, images.length, onClose, setIndex]);
  if (!open || !image) return null;
  return createPortal(<div className="gallery-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><section className="gallery-dialog" role="dialog" aria-modal="true" aria-label={`${prompt.title} sample gallery`} ref={dialog}>
    <header className="gallery-toolbar"><span>{prompt.title}</span><span aria-live="polite">{safeIndex + 1} / {images.length}</span><button type="button" aria-label={zoom ? 'Zoom out' : 'Zoom in'} aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? <ZoomOut /> : <ZoomIn />}</button><button type="button" ref={close} onClick={onClose} aria-label="Close gallery"><X /></button></header>
    <div className={`gallery-lightbox-stage${zoom ? ' is-zoomed' : ''}`} onTouchStart={event => { touch.current = [event.touches[0].clientX, event.touches[0].clientY]; }} onTouchEnd={event => { if (!touch.current || zoom) return; const dx = event.changedTouches[0].clientX - touch.current[0], dy = event.changedTouches[0].clientY - touch.current[1]; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1); touch.current = null; }}>
      <GalleryImage key={image.id} image={image} title={prompt.title} index={safeIndex} large />
    </div>
    {images.length > 1 ? <div className="gallery-lightbox-arrows"><button type="button" aria-label="Previous sample image" onClick={() => move(-1)}><ArrowLeft /></button><button type="button" aria-label="Next sample image" onClick={() => move(1)}><ArrowRight /></button></div> : null}
    <footer className="gallery-lightbox-footer"><p>{image.caption || image.altText || `Sample ${safeIndex + 1}`}</p>{showPromptLink ? <PromptAccessLink className="button" href={`/prompts/${prompt.slug}`}>Open prompt</PromptAccessLink> : null}</footer>
  </section></div>, document.body);
}
export function SampleImageGallery({ prompt }) {
  const images = getSampleImages(prompt);
  const [active, setActive] = useState(() => getCoverIndex(prompt, images)), [open, setOpen] = useState(false);
  const close = useRef(() => setOpen(false)).current;
  const safeIndex = Math.min(active, images.length - 1), image = images[safeIndex];
  if (!image) return null;
  const instructions = imagePromptText(prompt, image, safeIndex);
  return <div className="sample-image-gallery">
    <button type="button" className="gallery-main-image" aria-label={`Expand sample ${safeIndex + 1}`} onClick={() => setOpen(true)}><GalleryImage key={image.id} image={image} title={prompt.title} index={safeIndex} large /><span className="gallery-expand"><Expand size={17} /> {images.length > 1 ? `${safeIndex + 1} / ${images.length}` : 'Expand'}</span></button>
    {images.length > 1 ? <div className="gallery-inline-controls"><button className="button-secondary compact" type="button" aria-label="Previous sample" onClick={() => setActive((safeIndex - 1 + images.length) % images.length)}><ArrowLeft size={17} /></button><span aria-live="polite">Sample {safeIndex + 1} of {images.length}</span><button className="button-secondary compact" type="button" aria-label="Next sample" onClick={() => setActive((safeIndex + 1) % images.length)}><ArrowRight size={17} /></button></div> : null}
    <div className="gallery-thumbnails" aria-label="Choose a sample image">{images.map((item, index) => <button className={safeIndex === index ? 'selected' : ''} aria-pressed={safeIndex === index} type="button" aria-label={`Show sample ${index + 1}${item.caption ? `: ${item.caption}` : ''}`} key={item.id} onClick={() => setActive(index)}><GalleryImage image={item} title={prompt.title} index={index} /></button>)}</div>
    {image.caption ? <p className="gallery-caption">{image.caption}</p> : null}
    {instructions ? <section className="gallery-image-instructions"><div className="prompt-workspace-heading"><h3>Instructions for sample {safeIndex + 1}</h3><CopyButton text={instructions} label="Copy this image prompt" trackingLabel={`${prompt.title} — sample ${safeIndex + 1}`} /></div><div className="prose prompt-scroll-box">{instructions}</div></section> : null}
    <GalleryLightbox prompt={prompt} images={images} index={safeIndex} setIndex={setActive} open={open} onClose={close} />
  </div>;
}
