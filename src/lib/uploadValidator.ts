export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

// <input accept="..."> 속성값으로 바로 사용
export const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";

export function validateImageFile(
  file: File | null,
  maxSizeBytes: number,
): string | null {
  if (!file) return "no file";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "JPG, PNG, WEBP 파일만 업로드할 수 있어요.";
  if (file.size > maxSizeBytes) return "too large";
  return null;
}
