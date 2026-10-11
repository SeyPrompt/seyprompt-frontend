"use client";

import {
  getCloudinaryImageSrcSet,
  getOptimizedCloudinaryImageUrl
} from "@/lib/cloudinary-image";

function stopPreviewMediaAction(event) {
  event.preventDefault();
}

export function ProtectedMediaFrame({ children, className = "", ...props }) {
  return (
    <div
      className={`protected-media-frame${className ? ` ${className}` : ""}`}
      onContextMenu={stopPreviewMediaAction}
      {...props}
    >
      {children}
    </div>
  );
}

export function ProtectedImage({
  alt,
  className = "",
  cloudinaryOptions,
  height,
  loading = "lazy",
  sizes,
  src,
  widths = [],
  width,
  ...props
}) {
  const imageOptions = {
    ...cloudinaryOptions,
    width: cloudinaryOptions?.width || width,
  };
  const optimizedSrc = src
    ? getOptimizedCloudinaryImageUrl(src, imageOptions)
    : src;
  const srcSet = src && widths.length
    ? getCloudinaryImageSrcSet(src, widths, { ...cloudinaryOptions, height: undefined })
    : undefined;

  return (
    <img
      alt={alt}
      className={`protected-media protected-media-image${className ? ` ${className}` : ""}`}
      decoding="async"
      draggable={false}
      height={height}
      loading={loading}
      onContextMenu={stopPreviewMediaAction}
      onDragStart={stopPreviewMediaAction}
      sizes={sizes}
      src={optimizedSrc}
      srcSet={srcSet}
      width={width}
      {...props}
    />
  );
}

export function ProtectedVideo({
  children,
  className = "",
  controlsList,
  poster,
  posterOptions,
  posterWidth,
  ...props
}) {
  const optimizedPoster = poster
    ? getOptimizedCloudinaryImageUrl(poster, { ...posterOptions, width: posterWidth })
    : poster;

  return (
    <video
      className={`protected-media protected-media-video${className ? ` ${className}` : ""}`}
      controlsList={["nodownload", controlsList].filter(Boolean).join(" ")}
      draggable={false}
      onContextMenu={stopPreviewMediaAction}
      onDragStart={stopPreviewMediaAction}
      poster={optimizedPoster}
      {...props}
    >
      {children}
    </video>
  );
}
