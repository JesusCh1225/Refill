"use client";

import { useEffect, useState } from "react";
import PostsTab from "@/app/admin/tabs/PostsTab";
import UsersTab from "@/app/admin/tabs/UsersTab";
import ChatLogsTab from "@/app/admin/tabs/ChatLogsTab";
import DangerZone from "@/app/admin/tabs/DangerZone";

type Tab = "posts" | "reports" | "users" | "chats" | "danger";
type Status = "PENDING" | "RESOLVED" | "DISMISSED" | "ALL";
type Report = {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: number; nickname: string | null; name: string | null } | null;
  post: { id: number; title: string } | null;
  communityPost: { id: number; title: string } | null;
};

function ReportsTab() {
  const [status, setStatus] = useState<Status>("PENDING");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/reports?status=${status}&page=${page}`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "관리자 권한이 없습니다." : "신고 내역을 불러오지 못했습니다.");
        return r.json();
      })
      .then((data: { reports: Report[]; total: number; pageSize: number }) => {
        setReports(data.reports);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setError("");
      })
      .catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, version]);

  const refresh = () => { setLoading(true); setVersion((v) => v + 1); };
  async function resolve(report: Report, next: "RESOLVED" | "DISMISSED", hidePost = false) {
    if (hidePost && !window.confirm("주의: 지도 게시글은 숨겨지고 커뮤니티 게시글은 삭제될 수 있습니다. 계속하시겠습니까?")) return;
    setBusy(report.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, hidePost }),
      });
      if (!response.ok) throw new Error("신고 처리에 실패했습니다.");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally { setBusy(null); }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">신고 관리 ({total}건)</h2>
        <button type="button" onClick={refresh} className="rounded-lg border px-3 py-2 text-sm cursor-pointer">새로고침</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {([ ["PENDING", "미처리"], ["RESOLVED", "완료"], ["DISMISSED", "기각"], ["ALL", "전체"] ] as const).map(([value, label]) => (
          <button type="button" key={value} onClick={() => { setLoading(true); setPage(1); setStatus(value); }}
            className={`rounded-lg border px-3 py-2 text-sm cursor-pointer ${status === value ? "bg-brand text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {loading ? <p>불러오는 중...</p> : reports.length === 0 ? <p className="rounded-xl border bg-white p-5">해당 신고가 없습니다.</p> : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const href = r.post ? `/post/${r.post.id}` : r.communityPost ? `/community/${r.communityPost.id}` : null;
            const title = r.post?.title ?? r.communityPost?.title ?? "삭제된 게시글";
            return <div key={r.id} className="rounded-xl border border-border-card bg-white p-4 flex flex-col gap-3">
              <div className="flex justify-between gap-2">
                <div>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline">{title}</a> : <strong>{title}</strong>}
                  <p className="text-xs text-text-muted mt-1">{new Date(r.createdAt).toLocaleString("ko-KR")} · 신고자: {r.reporter?.nickname || r.reporter?.name || `회원 #${r.reporter?.id ?? "?"}`}</p>
                </div>
                <span className="text-xs whitespace-nowrap">{r.status === "PENDING" ? "미처리" : r.status === "RESOLVED" ? "완료" : "기각"}</span>
              </div>
              <p className="text-sm">신고 사유: <strong>{r.reason}</strong></p>
