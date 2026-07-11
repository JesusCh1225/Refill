import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  if (!section) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            communityPosts: true,
            posts: true,
            communityComments: true,
            comments: true,
          },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(user);
  }

  if (section === "communityPosts") {
    const [total, items] = await Promise.all([
      prisma.communityPost.count({ where: { authorId: id } }),
      prisma.communityPost.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
  }

  if (section === "mapPosts") {
    const [total, items] = await Promise.all([
      prisma.post.count({ where: { authorId: id, status: { not: "DELETED" } } }),
      prisma.post.findMany({
        where: { authorId: id, status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          location: true,
          status: true,
          createdAt: true,
          categories: { select: { category: { select: { name: true } } } },
          _count: { select: { comments: true } },
        },
      }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
  }

  if (section === "communityComments") {
    const [total, items] = await Promise.all([
      prisma.communityComment.count({ where: { authorId: id } }),
      prisma.communityComment.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: { select: { id: true, title: true } },
        },
      }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
  }

  if (section === "mapComments") {
    const [total, items] = await Promise.all([
      prisma.comment.count({ where: { authorId: id } }),
      prisma.comment.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          content: true,
          createdAt: true,
          postId: true,
          post: { select: { id: true, title: true } },
        },
      }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
  }

  return NextResponse.json({ error: "invalid section" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
