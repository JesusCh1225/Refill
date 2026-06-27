import Link from "next/link";

export default function Footer() {
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
