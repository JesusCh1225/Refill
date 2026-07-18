"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  userId: number;
  className?: string;
}

export default function ChatButton({ userId, className }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as number | undefined;

  if (!session || myId === userId) return null;

  return (
    <button
      onClick={() => router.push(`/messages/${userId}`)}
      className={className ?? "px-3 h-7 rounded-lg border border-brand text-brand text-[12px] font-semibold bg-transparent cursor-pointer hover:bg-brand-bg transition-colors shrink-0"}
    >
      채팅하기
    </button>
  );
}
