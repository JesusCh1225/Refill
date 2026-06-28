import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://refill-blush.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Refill | 음악 레슨·교류 플랫폼",
    template: "%s | Refill",
  },
  description: "악기 레슨 선생님 찾기, 세션 구인, 합주 모집까지 — 음악인을 위한 교류 공간 Refill",
  keywords: ["음악 레슨", "악기 레슨", "음악 선생님", "세션", "합주", "음악 교류", "Refill"],
  authors: [{ name: "Refill" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Refill",
    title: "Refill | 음악 레슨·교류 플랫폼",
    description: "악기 레슨 선생님 찾기, 세션 구인, 합주 모집까지 — 음악인을 위한 교류 공간",
    images: [
      {
        url: "/og-image.png",
        width: 862,
        height: 335,
        alt: "Refill",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refill | 음악 레슨·교류 플랫폼",
    description: "악기 레슨 선생님 찾기, 세션 구인, 합주 모집까지 — 음악인을 위한 교류 공간",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 모바일 핀치줌(브라우저 네이티브 확대)을 막아 지도 마커가 함께 늘어나 보이는 문제를 방지
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-page text-text-body">
        <SessionProvider><ToastProvider>{children}</ToastProvider></SessionProvider>
      </body>
    </html>
  );
}
