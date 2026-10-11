const CLOUDINARY_HOST = "res.cloudinary.com";
const TRANSFORMATION_PART_PATTERN =
  /^(a|ar|b|bo|c|co|cs|d|dpr|e|f|fl|fn|g|h|l|o|pg|q|r|t|u|w|x|y|z)_/;
const AUTO_OPTIMIZATION_SEGMENTS = ["f_auto", "q_auto"];

function isTransformationSegment(segment) {
  return Boolean(segment) && segment.split(",").every((part) => TRANSFORMATION_PART_PATTERN.test(part));
}

function isVersionSegment(segment) {
  return /^v\d+$/.test(segment);
}

function isSignatureSegment(segment) {
  return /^s--[^/]+--$/.test(segment);
}

function hasTransformationPart(segments, prefixOrValue) {
  return segments.some((segment) =>
    segment.split(",").some((part) =>
      prefixOrValue.endsWith("_")
        ? part.startsWith(prefixOrValue)
        : part === prefixOrValue
    )
  );
}

function parseCloudinaryImageUrl(source) {
  let url;

  try {
    url = new URL(source);
  } catch (_error) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const [cloudName, resourceType, deliveryType, ...deliverySegments] = segments;

  if (
    url.hostname !== CLOUDINARY_HOST ||
    resourceType !== "image" ||
    deliveryType !== "upload" ||
    !cloudName ||
    deliverySegments.length === 0 ||
    deliverySegments.some(isSignatureSegment)
  ) {
    return null;
  }

  const versionIndex = deliverySegments.findIndex(isVersionSegment);
  const transformationSegments = [];
  let versionSegment = "";
  let publicIdSegments = deliverySegments;

  if (versionIndex >= 0) {
    transformationSegments.push(...deliverySegments.slice(0, versionIndex));
    versionSegment = deliverySegments[versionIndex];
    publicIdSegments = deliverySegments.slice(versionIndex + 1);
  } else {
    while (publicIdSegments.length && isTransformationSegment(publicIdSegments[0])) {
      transformationSegments.push(publicIdSegments[0]);
      publicIdSegments = publicIdSegments.slice(1);
    }
  }

  if (!publicIdSegments.length) {
    return null;
  }

  return {
    cloudName,
    publicId: publicIdSegments.join("/"),
    transformationSegments,
    url,
    versionSegment,
  };
}

function getResizeTransformation({ crop = "fill", height, width } = {}) {
  const parts = [];

  if (width) {
    parts.push(`w_${Number(width)}`);
  }

  if (height) {
    parts.push(`h_${Number(height)}`);
  }

  if (parts.length && crop) {
    parts.push(`c_${crop}`);
  }

  return parts.join(",");
}

export function getOptimizedCloudinaryImageUrl(source, options = {}) {
  const parsed = parseCloudinaryImageUrl(source);

  if (!parsed) {
    return source;
  }

  const transformationSegments = parsed.transformationSegments.filter(
    (segment) => !AUTO_OPTIMIZATION_SEGMENTS.includes(segment)
  );
  const resizeTransformation = getResizeTransformation(options);

  if (resizeTransformation) {
    transformationSegments.push(resizeTransformation);
  }

  for (const segment of AUTO_OPTIMIZATION_SEGMENTS) {
    const prefix = `${segment.split("_")[0]}_`;

    if (!hasTransformationPart(transformationSegments, prefix)) {
      transformationSegments.push(segment);
    }
  }

  const nextSegments = [
    parsed.cloudName,
    "image",
    "upload",
    ...transformationSegments,
    parsed.versionSegment,
    parsed.publicId,
  ].filter(Boolean);
  const nextUrl = new URL(parsed.url.toString());

  nextUrl.pathname = `/${nextSegments.join("/")}`;
  return nextUrl.toString();
}

export function getCloudinaryImageSrcSet(source, widths = [], options = {}) {
  return widths
    .map((width) => Number(width))
    .filter((width) => Number.isFinite(width) && width > 0)
    .map((width) => `${getOptimizedCloudinaryImageUrl(source, { ...options, width })} ${width}w`)
    .join(", ");
}
