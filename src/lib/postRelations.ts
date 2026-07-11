import { prisma } from "@/lib/prisma";

// 게시글의 카테고리/해시태그/지역태그/이미지를 "생성"하는 공용 함수.
// PrismaNeonHttp는 트랜잭션을 지원하지 않고, createMany()도 내부적으로
// 트랜잭션을 사용해 이 어댑터에서는 동작하지 않는다. 대신 개별 create()를
// Promise.all로 병렬 실행해 라운드트립 "횟수"는 그대로지만 총 소요 시간을 줄인다.
// 호출부(POST/PATCH)는 필요 시 deleteMany로 기존 관계를 먼저 비운 뒤 이 함수들을 호출한다.

export async function syncPostCategories(postId: number, slugs: string[]) {
  if (!Array.isArray(slugs) || slugs.length === 0) return;
  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs.slice(0, 20) } },
    select: { id: true },
  });
  await Promise.all(
    categories.map((c) => prisma.postCategory.create({ data: { postId, categoryId: c.id } })),
  );
}

export async function syncPostHashtags(postId: number, names: string[]) {
  const trimmed = [
    ...new Set(
      (Array.isArray(names) ? names : [])
        .slice(0, 10)                        // 최대 10개
        .map((n) => n?.trim().slice(0, 50))  // 각 50자 제한
        .filter(Boolean),
    ),
  ] as string[];
  if (trimmed.length === 0) return;

  const existing = await prisma.hashtag.findMany({
    where: { name: { in: trimmed } },
    select: { id: true, name: true },
  });
  const existingNames = new Set(existing.map((h) => h.name));
  const missing = trimmed.filter((n) => !existingNames.has(n));

  const created = await Promise.all(
    missing.map((name) => prisma.hashtag.create({ data: { name }, select: { id: true } })),
  );
  const allIds = [...existing.map((h) => h.id), ...created.map((h) => h.id)];

  await Promise.all(
    allIds.map((hashtagId) => prisma.postHashtag.create({ data: { postId, hashtagId } })),
  );
}

export async function syncPostLocationTags(postId: number, tags: string[]) {
  const trimmed = (Array.isArray(tags) ? tags : [])
    .slice(0, 5)  // 최대 5개
    .map((t) => t?.trim())
    .filter(Boolean) as string[];
  if (trimmed.length === 0) return;
  await Promise.all(
    trimmed.map((tag) => prisma.postLocationTag.create({ data: { postId, tag: tag.slice(0, 50) } })),
  );
}

export async function syncPostImages(postId: number, urls: string[]) {
  const list = (Array.isArray(urls) ? urls : [])
    .slice(0, 10)  // 최대 10장
    .filter((url): url is string =>
      typeof url === "string" && url.startsWith("https://"),  // https:// 만 허용
    );
  if (list.length === 0) return;
  await Promise.all(
    list.map((url, i) => prisma.postImage.create({ data: { postId, url, order: i } })),
  );
}
