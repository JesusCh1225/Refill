import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(path.resolve(__dirname, ".."));

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const prisma = new PrismaClient({ adapter });

  const categoryDefs = [
    { slug: "lesson",     name: "레슨" },
    { slug: "band",       name: "밴드/합주" },
    { slug: "guitar",     name: "기타/베이스" },
    { slug: "drum",       name: "드럼" },
    { slug: "piano",      name: "피아노/건반" },
    { slug: "vocal",      name: "보컬/노래" },
    { slug: "wind",       name: "관악기" },
    { slug: "string",     name: "현악기" },
    { slug: "dj",         name: "DJ/전자음악" },
    { slug: "record",     name: "음반/LP" },
    { slug: "book",       name: "교재/악보" },
    { slug: "instrument", name: "악기거래" },
    { slug: "equipment",  name: "음향장비" },
    { slug: "etc",        name: "기타" },
  ];

  for (const cat of categoryDefs) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log(`✅ ${categoryDefs.length}개 카테고리 완료`);

  await prisma.$disconnect();
}

main().catch(console.error);
