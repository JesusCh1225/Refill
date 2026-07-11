import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionUserId } from "@/lib/auth";
import { EXT_BY_MIME, validateImageFile, validateMagicBytes } from "@/lib/uploadValidator";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const validationError = validateImageFile(file, MAX_SIZE);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  if (!(await validateMagicBytes(file))) {
    return NextResponse.json({ error: "JPG, PNG, WEBP 파일만 업로드할 수 있어요." }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type] ?? "jpg";
  const filename = `posts/${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[post-image upload error]", err);
    return NextResponse.json({ error: "업로드에 실패했어요." }, { status: 500 });
  }
}
