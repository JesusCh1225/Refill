export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateImageFile(
  file: File | null,
  maxSizeBytes: number,
): string | null {
  if (!file) return "no file";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "invalid type";
  if (file.size > maxSizeBytes) return "too large";
  return null;
}
