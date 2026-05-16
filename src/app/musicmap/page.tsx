import Header from "@/components/organisms/Header";

export default function MusicMapPage() {
  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <main
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        <p className="text-[22px] font-medium text-text-muted">
          음악맵 페이지 입니다.
        </p>
      </main>
      ㄴ
    </div>
  );
}
