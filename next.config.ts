import type { NextConfig } from "next";

const securityHeaders = [
  // 클릭재킹 방지
  { key: "X-Frame-Options", value: "DENY" },
  // MIME 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer 정보 최소화
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 불필요한 브라우저 기능 비활성화
  { key: "Permissions-Policy", value: "camera=()" },
  // HTTPS 강제 (Vercel은 항상 HTTPS이므로 안전)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // XSS 필터 (레거시 브라우저 대응)
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Vercel Blob 아바타 이미지
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
