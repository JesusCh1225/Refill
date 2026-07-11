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

// 파일 앞 12바이트로 실제 포맷 확인 (MIME 헤더 위조 방어)
export async function validateMagicBytes(file: File): Promise<boolean> {
  const buf = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buf);

  // JPEG: FF D8 FF
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true;
  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return true;

  return false;
}
