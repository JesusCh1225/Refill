import Link from "next/link";
import Avatar from "@/components/atom/Avatar";

interface Author { id: number; nickname: string | null; name: string; avatarUrl: string | null; }
interface Post {
  id: number;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  author: Author;
  _count: { comments: number; likes: number };
}

const CATEGORY_COLOR: Record<string, string> = {
  "자유": "bg-brand-bg text-brand",
  "문의": "bg-amber-50 text-amber-600",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}

export default function CommunityPostCard({ post }: { post: Post }) {
  const displayName = post.author.nickname ?? post.author.name;
  const preview = stripHtml(post.content);

  return (
    <Link href={`/community/${post.id}`} className="block">
      <div className="bg-white rounded-2xl border border-border-card px-5 py-4 hover:border-brand/40 hover:shadow-sm transition-all">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[post.category] ?? "bg-surface-card text-text-muted"}`}>
            {post.category}
          </span>
          <h2 className="text-[15px] font-semibold text-text-heading truncate flex-1">{post.title}</h2>
        </div>
        {preview && (
          <p className="text-[13px] text-text-muted leading-relaxed line-clamp-2 mb-3">{preview}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={post.author.avatarUrl} name={displayName} className="w-5 h-5" textClassName="text-[9px]" />
            <span className="text-[12px] text-text-muted">{displayName}</span>
            <span className="text-[11px] text-text-placeholder">{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-text-muted">
            <span>댓글 {post._count.comments}</span>
            <span>♥ {post._count.likes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
