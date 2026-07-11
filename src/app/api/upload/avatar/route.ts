import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { EXT_BY_MIME, validateImageFile, validateMagicBytes } from "@/lib/uploadValidator";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

  // 기존 커스텀 아바타 삭제 (Vercel Blob URL인 경우)
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  if (existing?.avatarUrl?.includes(".blob.vercel-storage.com")) {
    await del(existing.avatarUrl).catch(() => {});
  }

  const ext = EXT_BY_MIME[file.type] ?? "jpg";
  const filename = `avatars/${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  // DB 업데이트
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}

// DELETE: 커스텀 아바타 제거 (OAuth 사진으로 복원)
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (user?.avatarUrl?.includes(".blob.vercel-storage.com")) {
    await del(user.avatarUrl).catch(() => {});
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ ok: true });
}
