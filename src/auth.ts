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

    async jwt({ token, user }) {
      if (user?.id) token.userId = parseInt(user.id);
      return token;
    },

    async session({ session, token }) {
      if (token.userId) (session.user as any).id = token.userId;
      return session;
    },
  },

  pages: { signIn: "/login" },
});
