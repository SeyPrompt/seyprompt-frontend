export function getSampleImages(prompt) {
  if (prompt?.sampleImages?.length) return prompt.sampleImages;
  if (prompt?.sampleOutput?.type === 'image' && prompt.sampleOutput.value) return [{ ...prompt.sampleOutput, id: 'legacy-sample', altText: prompt.sampleOutput.fileName || `${prompt.title} sample` }];
  return [];
}
export const sampleImageUrl = image => image?.watermarkedPreviewUrl || image?.value || '';
export function getCoverIndex(prompt, images = getSampleImages(prompt)) {
  return Math.max(0, images.findIndex(image => image.id === prompt?.sampleCoverId));
}
export function imagePromptText(prompt, image, index) {
  if (prompt?.samplePromptMode !== 'per-image' || !image?.instructions) return '';
  return [prompt.prompt, `IMAGE ${index + 1}${image.caption ? ` — ${image.caption}` : ''}`, image.instructions].filter(Boolean).join('\n\n');
}
