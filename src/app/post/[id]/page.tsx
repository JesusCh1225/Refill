import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostDetailClient from "./PostDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    select: {
      title: true,
      description: true,
      categories: { select: { category: { select: { name: true } } }, take: 1 },
    },
  });

  if (!post) return { title: "게시글 | Refill" };

  const category = post.categories[0]?.category.name ?? "";
  const description = post.description
    ? post.description.slice(0, 120)
    : `${category} 관련 게시글`;

  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} | Refill`,
      description,
      images: [{ url: "/og-image.png", width: 862, height: 335, alt: "Refill" }],
    },
  };
}

export default function PostDetailPage({ params }: Props) {
  return <PostDetailClient params={params} />;
}
