import Link from "next/link";
import Header from "@/components/organisms/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center px-4">
        <p className="text-6xl font-bold text-brand">404</p>
        <p className="text-[18px] font-semibold text-text-heading">페이지를 찾을 수 없어요</p>
        <p className="text-[14px] text-text-muted">
          주소가 잘못되었거나 삭제된 페이지예요.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 rounded-full bg-brand text-white text-[13px] font-medium hover:opacity-80 transition-opacity"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
