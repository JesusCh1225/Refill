import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { generateUniqueNickname } from "@/lib/randomNickname";

// provider별 실명/닉네임 분리
function extractProfile(
  provider: string,
  user: { name?: string | null },
  profile: unknown,
): { realName: string | null; oauthNickname: string | null } {
  const p = profile as Record<string, any>;

  if (provider === "naver") {
    // Naver: user.name = 실명, profile.response.nickname = 닉네임
    return {
      realName: user.name?.trim() || null,
      oauthNickname: (p?.response?.nickname as string)?.trim() || null,
    };
  }

  if (provider === "kakao") {
    // Kakao: user.name = 닉네임, profile.kakao_account.name = 실명
    return {
      realName: (p?.kakao_account?.name as string)?.trim() || null,
      oauthNickname: user.name?.trim() || null,
    };
  }

  // Google: user.name = 실명, 별도 닉네임 없음
  return {
    realName: user.name?.trim() || null,
    oauthNickname: null,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    Naver({
      clientId: process.env.NAVER_OAUTH_CLIENT_ID!,
      clientSecret: process.env.NAVER_OAUTH_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false;

      try {
        const existing = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (existing) {
          await prisma.oAuthAccount.update({
            where: { id: existing.id },
            data: {
              accessToken: account.access_token ?? undefined,
              refreshToken: account.refresh_token ?? undefined,
              expiresAt: account.expires_at ?? undefined,
            },
          });
          user.id = String(existing.userId);
          return true;
        }

        const { realName, oauthNickname } = extractProfile(account.provider, user, profile);

        // 닉네임: OAuth 제공 → 없으면 랜덤 생성 (nickname 필드 중복 체크)
        const displayNickname = oauthNickname
          ? oauthNickname
          : await generateUniqueNickname(
              (n) => prisma.user.findFirst({ where: { nickname: n }, select: { id: true } }).then(Boolean),
            );

        const newUser = await prisma.user.create({
          data: {
            name: (realName ?? "").slice(0, 50),
            nickname: displayNickname.slice(0, 50),
            email: user.email ? user.email.slice(0, 255) : undefined,
          },
        });

        try {
          await prisma.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token ?? undefined,
              refreshToken: account.refresh_token ?? undefined,
              expiresAt: account.expires_at ?? undefined,
            },
          });
        } catch (oauthErr) {
          await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
          throw oauthErr;
        }

        user.id = String(newUser.id);
        return true;
      } catch (err) {
        console.error("[auth] signIn error:", err);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.userId = parseInt(user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(user.id) },
          select: { avatarUrl: true, name: true, nickname: true },
        });
        if (dbUser?.avatarUrl) token.picture = dbUser.avatarUrl;
        // 헤더/세션에 표시될 이름: 닉네임 우선, 없으면 실명
        token.name = dbUser?.nickname ?? dbUser?.name ?? token.name;
      }
      // 기존 세션에 token.name이 없으면 DB에서 복구
      if (!token.name && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as number },
          select: { name: true, nickname: true },
        });
        token.name = dbUser?.nickname ?? dbUser?.name ?? undefined;
      }
      if (trigger === "update") {
        const s = (session ?? {}) as Record<string, unknown>;
        if ("image" in s) token.picture = (s.image as string) ?? null;
        if ("name" in s) token.name = s.name as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) (session.user as any).id = token.userId;
      if (token.picture !== undefined) session.user.image = (token.picture as string) ?? undefined;
      return session;
    },
  },

  pages: { signIn: "/login", error: "/login" },
});
