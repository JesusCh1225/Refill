export interface CommentData {
  id: number;
  content: string | null; // null = 비밀 댓글 중 열람 불가
  isSecret: boolean;
  guestName: string | null;
  authorId: number | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string; nickname: string | null } | null;
  replies?: CommentData[];
}

export function displayAuthor(c: CommentData): string {
  if (c.author) return c.author.nickname || c.author.name;
  return c.guestName || "익명";
}

export function isEdited(c: CommentData): boolean {
  return Math.abs(new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) > 1000;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
