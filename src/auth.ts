import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    Naver({
      clientId: process.env.NAVER_SEARCH_CLIENT_ID!,
      clientSecret: process.env.NAVER_SEARCH_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
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

        const newUser = await prisma.user.create({
          data: {
            name: (user.name ?? "사용자").slice(0, 50),
            email: user.email ? user.email.slice(0, 255) : undefined,
          },
        });

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
        // 커스텀 아바타가 있으면 OAuth 프로필 이미지 대신 사용
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(user.id) },
          select: { avatarUrl: true },
        });
        if (dbUser?.avatarUrl) token.picture = dbUser.avatarUrl;
      }
      if (trigger === "update" && "image" in (session ?? {})) {
        token.picture = (session as any).image ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) (session.user as any).id = token.userId;
      if (token.picture !== undefined) session.user.image = (token.picture as string) ?? undefined;
      return session;
    },
  },

  pages: { signIn: "/login" },
});
