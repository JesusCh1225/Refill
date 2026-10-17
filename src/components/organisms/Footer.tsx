"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = [
  /^\/messages\/\d+/,   // 채팅방
  /^\/musicmap/,        // 지도 (풀스크린)
  /^\/community\/write/, // 커뮤니티 글쓰기
  /^\/community\/\d+\/edit/, // 커뮤니티 글 수정
];

export default function Footer() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.some((re) => re.test(pathname))) return null;

  return (
    <footer className="border-t border-border-header bg-white mt-auto">
      <div className="mx-auto px-4 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ maxWidth: "1200px" }}>
        <p className="text-[12px] text-text-placeholder">© 2025 Refill. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-[12px] text-text-muted hover:text-text-body transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="text-[12px] text-text-muted hover:text-text-body transition-colors">
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  );
}
