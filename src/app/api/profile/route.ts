import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// ── OAuth 연결 해제 ────────────────────────────────────────────────────────

async function revokeKakao(accessToken: string) {
  await fetch("https://kapi.kakao.com/v1/user/unlink", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}

async function revokeNaver(accessToken: string) {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID ?? "";
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET ?? "";
  const url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${clientId}&client_secret=${clientSecret}&access_token=${encodeURIComponent(accessToken)}&service_provider=NAVER`;
  await fetch(url).catch(() => {});
}

// ── GET /api/profile ───────────────────────────────────────────────────────

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      bio: true,
      contact: true,
      representativeSong: true,
      createdAt: true,
      oauthAccounts: { select: { provider: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}

// ── PATCH /api/profile ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, string | null> = {};

  if ("nickname" in body) {
    const trimmed = (body.nickname ?? "").trim();
    if (!trimmed) return NextResponse.json({ error: "nickname required" }, { status: 400 });
    if (trimmed.length > 50) return NextResponse.json({ error: "too long" }, { status: 400 });
    data.nickname = trimmed;
  }
  if ("bio" in body) {
    data.bio = body.bio ? String(body.bio).slice(0, 500) : null;
  }
  if ("contact" in body) {
    data.contact = body.contact ? String(body.contact).slice(0, 200) : null;
  }
  if ("representativeSong" in body) {
    data.representativeSong = body.representativeSong ? String(body.representativeSong).slice(0, 500) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, nickname: true, bio: true, contact: true, representativeSong: true },
  });

  return NextResponse.json(user);
}

// ── DELETE /api/profile ────────────────────────────────────────────────────

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId },
    select: { provider: true, accessToken: true },
  });

  // 각 OAuth 서비스에 연결 해제 요청 (병렬)
  await Promise.allSettled(
    accounts.map((acc) => {
      if (!acc.accessToken) return Promise.resolve();
      if (acc.provider === "kakao") return revokeKakao(acc.accessToken);
      if (acc.provider === "naver") return revokeNaver(acc.accessToken);
      return Promise.resolve();
    }),
  );

  // DB에서 사용자 삭제 (cascade로 OAuthAccount, Post 등 함께 삭제)
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
