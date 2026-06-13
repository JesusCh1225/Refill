import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(path.resolve(__dirname, ".."));

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Neon HTTP 모드는 트랜잭션 불가 → 중첩 writes 없이 모든 관계를 개별 INSERT로 처리

async function upsertFind<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>,
): Promise<T> {
  const existing = await findFn();
  if (existing) return existing;
  return createFn();
}

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const prisma = new PrismaClient({ adapter });

  // ── 카테고리 ─────────────────────────────────────────────────────────
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
    { slug: "instrument", name: "악기거래" },
    { slug: "equipment",  name: "음향장비" },
    { slug: "etc",        name: "기타" },
  ];

  for (const cat of categoryDefs) {
    await upsertFind(
      () => prisma.category.findUnique({ where: { slug: cat.slug } }),
      () => prisma.category.create({ data: cat }),
    );
  }
  console.log(`✅ ${categoryDefs.length}개 카테고리 완료`);

  const catMap: Record<string, number> = {};
  for (const cat of await prisma.category.findMany()) {
    catMap[cat.slug] = cat.id;
  }

  // ── 유저 (중첩 없이 개별 생성) ───────────────────────────────────────
  async function getOrCreateUser(data: {
    email: string; name: string; nickname: string;
    bio?: string; contact?: string;
    provider: string; providerAccountId: string;
  }) {
    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: data.email, name: data.name, nickname: data.nickname, bio: data.bio, contact: data.contact },
      });
    }
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: data.provider, providerAccountId: data.providerAccountId } },
    });
    if (!existingOAuth) {
      await prisma.oAuthAccount.create({
        data: { userId: user.id, provider: data.provider, providerAccountId: data.providerAccountId },
      });
    }
    return user;
  }

  const minjun = await getOrCreateUser({ email: "minjun.seed@example.com", name: "김민준", nickname: "기타리스트민준", bio: "10년 경력 기타리스트입니다. 홍대 앞에서 어쿠스틱/일렉 레슨 중이에요!", contact: "카카오톡: guitar_minjun", provider: "kakao", providerAccountId: "seed_kakao_001" });
  const seoyeon = await getOrCreateUser({ email: "seoyeon.seed@example.com", name: "이서연", nickname: "드러머서연", bio: "현직 세션 드러머, 레슨 선생님. 강남/서초 기반 활동.", contact: "Instagram: @drummer_seoyeon", provider: "naver", providerAccountId: "seed_naver_002" });
  const jiho = await getOrCreateUser({ email: "jiho.seed@example.com", name: "박지호", nickname: "박지호보컬", bio: "인디밴드 보컬 겸 보컬 레슨 선생님. 신촌/홍대 활동 중.", contact: "카카오: jihopark_vocal", provider: "google", providerAccountId: "seed_google_003" });
  const yuna = await getOrCreateUser({ email: "yuna.seed@example.com", name: "최유나", nickname: "피아노유나", bio: "클래식 음대 졸업, 재즈 피아노 연주자. 레슨 및 세션 활동 중.", provider: "kakao", providerAccountId: "seed_kakao_004" });
  const taeyang = await getOrCreateUser({ email: "taeyang.seed@example.com", name: "정태양", nickname: "베이시스트태양", bio: "펑크/재즈 베이시스트. 다양한 밴드 세션 및 정규 활동 경험 있습니다.", contact: "오픈채팅: 베이스태양", provider: "naver", providerAccountId: "seed_naver_005" });
  console.log("✅ 5명 유저 완료");

  // ── 해시태그 헬퍼 ─────────────────────────────────────────────────────
  async function htId(name: string) {
    return (await upsertFind(
      () => prisma.hashtag.findUnique({ where: { name } }),
      () => prisma.hashtag.create({ data: { name } }),
    )).id;
  }

  // ── 게시글 + 관계 생성 헬퍼 ──────────────────────────────────────────
  async function makePost(p: {
    title: string; description?: string;
    priceType: "FREE" | "MONTHLY" | "YEARLY" | "PER_SESSION" | "NEGOTIABLE";
    priceAmount?: number | null; priceDisplay: string;
    imageEmoji: string; location: string; lat: number; lng: number;
    direction: "OFFER" | "SEEK"; authorId: number;
    slugs: string[]; locTags: string[]; tags: string[];
  }) {
    const post = await prisma.post.create({
      data: {
        title: p.title, description: p.description ?? null,
        priceType: p.priceType as any, priceAmount: p.priceAmount ?? null,
        priceDisplay: p.priceDisplay, imageEmoji: p.imageEmoji,
        location: p.location, lat: p.lat, lng: p.lng,
        direction: p.direction as any, authorId: p.authorId,
      },
    });
    for (const slug of p.slugs) {
      if (catMap[slug]) {
        await prisma.postCategory.create({ data: { postId: post.id, categoryId: catMap[slug] } });
      }
    }
    for (const tag of p.locTags) {
      await prisma.postLocationTag.create({ data: { postId: post.id, tag } });
    }
    for (const name of p.tags) {
      const hashtagId = await htId(name);
      const existing = await prisma.postHashtag.findUnique({
        where: { postId_hashtagId: { postId: post.id, hashtagId } },
      });
      if (!existing) {
        await prisma.postHashtag.create({ data: { postId: post.id, hashtagId } });
      }
    }
    return post;
  }

  // ── 게시글 25개 ──────────────────────────────────────────────────────

  // ▸ 레슨 합니다
  const p1 = await makePost({
    title: "기타 입문/중급 레슨 합니다 (홍대, 방문 레슨 가능)",
    description: "안녕하세요! 기타 경력 10년, 레슨 경력 5년입니다.\n\n어쿠스틱·일렉 모두 가르치며 팝·록·재즈 등 원하시는 장르에 맞게 커리큘럼을 짜드립니다.\n\n• 입문자 환영, 첫 수업 무료 체험\n• 홍대 스튜디오 or 방문 레슨 모두 가능\n• 악보 읽기부터 코드, 솔로까지 단계별 진행",
    priceType: "MONTHLY", priceAmount: 150000, priceDisplay: "월 150,000원",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5575, lng: 126.9249, direction: "OFFER", authorId: minjun.id,
    slugs: ["lesson", "guitar"], locTags: ["서울", "마포", "홍대", "마포구"],
    tags: ["기타레슨", "입문레슨", "홍대레슨", "어쿠스틱기타", "일렉기타"],
  });

  const p2 = await makePost({
    title: "드럼 레슨 합니다 — 현직 세션 드러머, 강남 스튜디오",
    description: "현직 세션 드러머가 직접 가르칩니다.\n\n• 입문부터 고급까지 수준별 진행\n• 팝·록·재즈·메탈 다양한 장르\n• 강남역 도보 5분 거리 개인 스튜디오\n• 전자드럼 연습용 패드 대여 가능",
    priceType: "PER_SESSION", priceAmount: 70000, priceDisplay: "회당 70,000원",
    imageEmoji: "🥁", location: "서울 강남구 강남역",
    lat: 37.4979, lng: 127.0276, direction: "OFFER", authorId: seoyeon.id,
    slugs: ["lesson", "drum"], locTags: ["서울", "강남", "강남구", "강남역"],
    tags: ["드럼레슨", "강남레슨", "세션드러머", "드럼입문"],
  });

  const p3 = await makePost({
    title: "보컬·발성 레슨 합니다 (신촌, 월 2~4회)",
    description: "인디밴드 보컬 겸 음악 학원 강사 5년 경력입니다.\n\n발성 교정·호흡법·장르별 창법·음정/박자 교정 등 전반적인 보컬 트레이닝을 진행합니다. 온라인 레슨도 가능해요!",
    priceType: "MONTHLY", priceAmount: 200000, priceDisplay: "월 200,000원",
    imageEmoji: "🎤", location: "서울 서대문구 신촌",
    lat: 37.5594, lng: 126.9368, direction: "OFFER", authorId: jiho.id,
    slugs: ["lesson", "vocal"], locTags: ["서울", "신촌", "서대문구"],
    tags: ["보컬레슨", "발성레슨", "신촌레슨", "보컬트레이닝"],
  });

  const p4 = await makePost({
    title: "클래식·재즈 피아노 레슨 (마포구, 유연한 스케줄)",
    description: "클래식 음대 출신 피아니스트입니다.\n\n클래식·재즈·실용음악 등 다양하게 가르쳐드릴 수 있습니다. 초보자부터 심화 과정까지 성인·어린이 모두 환영합니다.",
    priceType: "MONTHLY", priceAmount: 180000, priceDisplay: "월 180,000원",
    imageEmoji: "🎹", location: "서울 마포구",
    lat: 37.5507, lng: 126.9493, direction: "OFFER", authorId: yuna.id,
    slugs: ["lesson", "piano"], locTags: ["서울", "마포", "마포구"],
    tags: ["피아노레슨", "재즈피아노", "클래식피아노", "마포레슨"],
  });

  const p5 = await makePost({
    title: "베이스 기타 레슨 합니다 (홍대, 협의 가능)",
    description: "다양한 밴드 세션 경력의 베이시스트입니다.\n\n펑크·재즈·록·R&B 등 다양한 장르 베이스라인을 이론+실기로 가르칩니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "협의",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5572, lng: 126.9240, direction: "OFFER", authorId: taeyang.id,
    slugs: ["lesson", "guitar"], locTags: ["서울", "마포", "홍대"],
    tags: ["베이스레슨", "베이스기타", "홍대레슨", "세션베이스"],
  });

  const p6 = await makePost({
    title: "관악기(색소폰·트럼펫) 레슨 합니다 (강남)",
    description: "음대 졸업 후 오케스트라·빅밴드 연주 경력이 있습니다. 클래식·재즈 모두 지도 가능하며 입문자 환영합니다.",
    priceType: "PER_SESSION", priceAmount: 60000, priceDisplay: "회당 60,000원",
    imageEmoji: "🎺", location: "서울 강남구",
    lat: 37.4976, lng: 127.0270, direction: "OFFER", authorId: minjun.id,
    slugs: ["lesson", "wind"], locTags: ["서울", "강남", "강남구"],
    tags: ["색소폰레슨", "트럼펫레슨", "관악기레슨", "강남레슨"],
  });

  // ▸ 레슨 구합니다
  const p7 = await makePost({
    title: "드럼 레슨 선생님 구합니다 — 주말 오후 가능하신 분",
    description: "직장인 취미로 드럼을 배우고 싶어요! 완전 초보라 기초부터 차근차근 배우고 싶습니다. 강남/서초 쪽 선호합니다.",
    priceType: "PER_SESSION", priceAmount: 60000, priceDisplay: "회당 60,000원",
    imageEmoji: "🥁", location: "서울 강남구",
    lat: 37.4981, lng: 127.0282, direction: "SEEK", authorId: yuna.id,
    slugs: ["lesson", "drum"], locTags: ["서울", "강남", "강남구", "서초"],
    tags: ["드럼레슨구합니다", "드럼입문", "강남드럼"],
  });

  const p8 = await makePost({
    title: "어쿠스틱 기타 레슨 구해요 (홍대·신촌 근처)",
    description: "기타를 처음 배워보려고 합니다. 코드 잡기부터 노래 한 곡 완성까지 목표로 하고 있어요. 저녁·주말 오전 가능합니다.",
    priceType: "MONTHLY", priceAmount: 120000, priceDisplay: "월 120,000원",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5580, lng: 126.9260, direction: "SEEK", authorId: jiho.id,
    slugs: ["lesson", "guitar"], locTags: ["서울", "마포", "홍대", "신촌"],
    tags: ["기타레슨구합니다", "어쿠스틱기타", "홍대기타레슨"],
  });

  const p9 = await makePost({
    title: "재즈 피아노 레슨 구합니다 (마포·홍대)",
    description: "클래식 피아노는 조금 칠 줄 아는데 재즈 보이싱·임프로바이제이션을 집중적으로 배우고 싶어요.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "협의",
    imageEmoji: "🎹", location: "서울 마포구",
    lat: 37.5510, lng: 126.9480, direction: "SEEK", authorId: taeyang.id,
    slugs: ["lesson", "piano"], locTags: ["서울", "마포", "홍대"],
    tags: ["재즈피아노레슨구합니다", "재즈피아노", "마포레슨"],
  });

  // ▸ 악기 팝니다
  const p10 = await makePost({
    title: "Fender American Standard Stratocaster 판매합니다",
    description: "2019년식 Fender American Standard Strat, 선버스트/화이트 픽가드.\n사용감 있지만 상태 양호, 케이스 포함. 강남·홍대 직거래 선호합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "850,000원",
    imageEmoji: "🎸", location: "서울 강남구",
    lat: 37.4975, lng: 127.0270, direction: "OFFER", authorId: minjun.id,
    slugs: ["instrument", "guitar"], locTags: ["서울", "강남", "강남구"],
    tags: ["펜더", "스트라토캐스터", "일렉기타판매", "기타중고"],
  });

  const p11 = await makePost({
    title: "Pearl Export 드럼 셋 팝니다 (하드웨어 포함)",
    description: "Pearl Export 5기통 드럼셋 판매합니다. 하드웨어 포함, 심벌 별도 협의.\n직접 오셔서 치고 구매하실 수 있어요. 마포구 직거래 원합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "450,000원",
    imageEmoji: "🥁", location: "서울 마포구",
    lat: 37.5508, lng: 126.9495, direction: "OFFER", authorId: seoyeon.id,
    slugs: ["instrument", "drum"], locTags: ["서울", "마포", "마포구"],
    tags: ["드럼판매", "드럼셋중고", "Pearl드럼", "드럼직거래"],
  });

  const p12 = await makePost({
    title: "야마하 디지털 피아노 P-125 판매 (6개월 사용)",
    description: "이사로 인해 급처합니다. 스탠드·페달·어댑터 모두 포함. 마포구 직거래 또는 택배 가능합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "280,000원",
    imageEmoji: "🎹", location: "서울 마포구",
    lat: 37.5505, lng: 126.9490, direction: "OFFER", authorId: yuna.id,
    slugs: ["instrument", "piano"], locTags: ["서울", "마포", "마포구"],
    tags: ["야마하피아노", "디지털피아노판매", "피아노중고", "P125"],
  });

  const p13 = await makePost({
    title: "Focusrite Scarlett 2i2 오디오 인터페이스 팝니다",
    description: "홈 레코딩 세팅 업그레이드로 처분합니다. 정상 작동, USB 케이블·박스 포함.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "120,000원",
    imageEmoji: "🔊", location: "서울 강남구",
    lat: 37.4980, lng: 127.0275, direction: "OFFER", authorId: taeyang.id,
    slugs: ["equipment"], locTags: ["서울", "강남", "강남구"],
    tags: ["오디오인터페이스", "Focusrite", "홈레코딩장비", "음향장비판매"],
  });

  const p14 = await makePost({
    title: "Gibson Les Paul Standard 2020 팝니다 (케이스 포함)",
    description: "깁슨 레스폴 스탠다드 허니버스트. 픽업 교체(Seymour Duncan) 상태이며 하드케이스 포함. 홍대 직거래 가능합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "1,200,000원",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5573, lng: 126.9250, direction: "OFFER", authorId: jiho.id,
    slugs: ["instrument", "guitar"], locTags: ["서울", "마포", "홍대"],
    tags: ["깁슨레스폴", "레스폴판매", "일렉기타중고", "Gibson"],
  });

  // ▸ 악기 삽니다
  const p15 = await makePost({
    title: "전자 드럼 삽니다 — 입문용, 예산 30만원 이내",
    description: "드럼 레슨 시작했는데 집에서 연습할 전자드럼 구합니다. 입문용이면 충분해요. 강남·서초 직거래 선호합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "30만원 이내",
    imageEmoji: "🥁", location: "서울 강남구",
    lat: 37.4978, lng: 127.0278, direction: "SEEK", authorId: jiho.id,
    slugs: ["instrument", "drum"], locTags: ["서울", "강남", "강남구", "서초"],
    tags: ["전자드럼구합니다", "드럼삽니다", "전자드럼중고"],
  });

  const p16 = await makePost({
    title: "어쿠스틱 기타 저렴하게 구합니다 (입문용)",
    description: "기타 배우기 시작해서 입문용 어쿠스틱 기타 하나 구합니다. 7만원 이하로 찾고 있어요. 홍대 직거래 가능합니다.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "7만원 이하",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5577, lng: 126.9245, direction: "SEEK", authorId: seoyeon.id,
    slugs: ["instrument", "guitar"], locTags: ["서울", "마포", "홍대"],
    tags: ["기타삽니다", "어쿠스틱기타구합니다", "입문기타"],
  });

  const p17 = await makePost({
    title: "소형 믹서 삽니다 (4~8채널, 홈 스튜디오용)",
    description: "홈 스튜디오 세팅용 소형 믹서 구합니다. Behringer·Yamaha·Mackie 등 무관합니다. 마포구 직거래 가능하시면 연락주세요.",
    priceType: "NEGOTIABLE", priceAmount: null, priceDisplay: "협의",
    imageEmoji: "🎚️", location: "서울 마포구",
    lat: 37.5506, lng: 126.9492, direction: "SEEK", authorId: minjun.id,
    slugs: ["equipment"], locTags: ["서울", "마포"],
    tags: ["믹서구합니다", "믹서삽니다", "소형믹서", "홈스튜디오"],
  });

  // ▸ 밴드 모집합니다
  const p18 = await makePost({
    title: "인디 밴드 드러머 모집합니다 (홍대 기반)",
    description: "3인조 인디·얼터너티브 밴드에서 드러머를 모집합니다!\n\n현재 구성: 기타/보컬, 베이스\n장르: 인디팝, 얼터너티브 록\n활동: 월 2~3회 합주, 상반기 공연 예정\n\n실력보다 음악에 대한 열정이 더 중요합니다. 편하게 연락주세요 :)",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🎼", location: "서울 마포구 홍대",
    lat: 37.5574, lng: 126.9252, direction: "OFFER", authorId: jiho.id,
    slugs: ["band", "drum"], locTags: ["서울", "마포", "홍대"],
    tags: ["드러머모집", "인디밴드", "밴드모집", "홍대밴드", "얼터너티브"],
  });

  const p19 = await makePost({
    title: "재즈 밴드 베이시스트·피아니스트 모집 (강남 합주)",
    description: "재즈 스탠다드 연주하는 소규모 재즈 밴드입니다.\n\n현재: 기타, 드럼, 색소폰 / 찾는 파트: 베이스 or 피아노\n월 2회 강남 스튜디오 합주, 라이브 공연 희망. 코드 읽을 줄 아시면 됩니다!",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🎷", location: "서울 강남구",
    lat: 37.4982, lng: 127.0280, direction: "OFFER", authorId: yuna.id,
    slugs: ["band"], locTags: ["서울", "강남", "강남구"],
    tags: ["재즈밴드", "밴드모집", "베이시스트모집", "피아니스트모집", "재즈"],
  });

  const p20 = await makePost({
    title: "록 밴드 보컬 모집합니다 (신촌 기반, 공연 목표)",
    description: "결성 1년 된 4인조 록밴드입니다. 보컬 탈퇴로 새 보컬을 찾고 있어요.\n\n장르: 모던록·인디팝 / 활동: 주 1회 합주, 연 2~3회 공연\n작사·작곡에 참여하실 분 환영합니다!",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🎤", location: "서울 서대문구 신촌",
    lat: 37.5596, lng: 126.9372, direction: "OFFER", authorId: taeyang.id,
    slugs: ["band", "vocal"], locTags: ["서울", "신촌", "서대문"],
    tags: ["보컬모집", "록밴드", "밴드모집", "신촌밴드", "모던록"],
  });

  // ▸ 밴드 합류 원합니다
  const p21 = await makePost({
    title: "기타리스트 밴드 합류 원합니다 (홍대·마포)",
    description: "기타 경력 7년, 다양한 장르 소화 가능합니다.\n\n선호 장르: 인디팝, 포스트록, 슈게이징\n가능 시간: 주말 + 평일 저녁\n\n화목한 분위기에서 음악 즐길 밴드 찾고 있어요 :)",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🎸", location: "서울 마포구 홍대",
    lat: 37.5576, lng: 126.9248, direction: "SEEK", authorId: minjun.id,
    slugs: ["band", "guitar"], locTags: ["서울", "마포", "홍대"],
    tags: ["기타리스트밴드합류", "밴드원합니다", "인디팝", "포스트록"],
  });

  const p22 = await makePost({
    title: "드러머 밴드 찾습니다 (강남·서초)",
    description: "드럼 5년 경력입니다. 팝·록·펑크 위주 연주해왔어요.\n주말 합주 가능하고 공연도 적극 참여하고 싶습니다. 연주 영상 공유 가능합니다.",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🥁", location: "서울 강남구",
    lat: 37.4977, lng: 127.0272, direction: "SEEK", authorId: seoyeon.id,
    slugs: ["band", "drum"], locTags: ["서울", "강남", "강남구", "서초"],
    tags: ["드러머밴드합류", "밴드찾아요", "드러머활동"],
  });

  const p23 = await makePost({
    title: "보컬 — 밴드 합류 원합니다 (서울 전체)",
    description: "인디팝·모던록 보컬, 경력 3년, 버스킹 경험 있어요.\n작사 참여 원하며 분위기 좋은 밴드라면 장르 무관합니다. 홍대·신촌·강남 모두 OK!",
    priceType: "FREE", priceAmount: null, priceDisplay: "무료",
    imageEmoji: "🎤", location: "서울",
    lat: 37.5665, lng: 126.9780, direction: "SEEK", authorId: jiho.id,
    slugs: ["band", "vocal"], locTags: ["서울", "홍대", "신촌", "강남"],
    tags: ["보컬밴드합류", "인디팝보컬", "밴드찾아요"],
  });

  // ▸ 지방
  const p24 = await makePost({
    title: "부산 서면 기타 레슨 합니다 (초중급 환영)",
    description: "부산 서면에서 통기타·일렉 레슨 합니다. 직장인·학생 모두 환영하며 스케줄 조율 가능합니다.",
    priceType: "PER_SESSION", priceAmount: 50000, priceDisplay: "회당 50,000원",
    imageEmoji: "🎸", location: "부산 부산진구 서면",
    lat: 35.1570, lng: 129.0590, direction: "OFFER", authorId: minjun.id,
    slugs: ["lesson", "guitar"], locTags: ["부산", "서면", "부산진구"],
    tags: ["부산기타레슨", "서면레슨", "부산레슨"],
  });

  const p25 = await makePost({
    title: "대전 둔산동 피아노·음악이론 레슨 (성인 환영)",
    description: "대전 둔산동에서 피아노 및 음악이론 레슨 합니다. 클래식 위주이지만 실용음악도 가능합니다. 성인 입문자 환영해요!",
    priceType: "MONTHLY", priceAmount: 160000, priceDisplay: "월 160,000원",
    imageEmoji: "🎹", location: "대전 서구 둔산동",
    lat: 36.3519, lng: 127.3845, direction: "OFFER", authorId: yuna.id,
    slugs: ["lesson", "piano"], locTags: ["대전", "둔산", "서구", "둔산동"],
    tags: ["대전피아노레슨", "둔산레슨", "대전레슨"],
  });

  console.log("✅ 25개 게시글 완료");

  // ── 댓글 / 대댓글 ────────────────────────────────────────────────────
  async function cmt(postId: number, authorId: number, content: string, parentId?: number) {
    return prisma.comment.create({ data: { postId, authorId, content, parentId: parentId ?? null } });
  }

  // p1: 기타 레슨 (홍대)
  const c1 = await cmt(p1.id, seoyeon.id, "레슨비 조율 가능한가요? 주 1회로 시작하고 싶어서요!");
  await cmt(p1.id, minjun.id, "네 물론이죠! 주 1회 기준으로 협의 가능합니다. 쪽지 주세요 😊", c1.id);
  await cmt(p1.id, taeyang.id, "저도 궁금했는데 감사합니다!", c1.id);
  await cmt(p1.id, yuna.id, "저도 관심 있어요. 피아노 치는데 기타도 배워보고 싶었거든요!");
  const c1b = await cmt(p1.id, jiho.id, "홍대에서 레슨 받는 곳이 따로 있나요? 아니면 카페 같은 곳에서?");
  await cmt(p1.id, minjun.id, "연습실 빌려서 진행하고 있어요! 홍대 2번 출구 도보 3분입니다.", c1b.id);
  await cmt(p1.id, jiho.id, "오 좋네요. 주말 오후도 가능한가요?", c1b.id);

  // p2: 드럼 레슨 (강남)
  const c2 = await cmt(p2.id, jiho.id, "체험 레슨도 가능한가요? 드럼을 한 번도 쳐본 적이 없어서요.");
  await cmt(p2.id, seoyeon.id, "네! 첫 수업은 체험으로 진행해드려요. 아무것도 몰라도 괜찮아요 :)", c2.id);
  await cmt(p2.id, yuna.id, "저도 체험해보고 싶어요!", c2.id);
  await cmt(p2.id, taeyang.id, "집에서 패드 연습만으로도 실력이 늘까요?");
  await cmt(p2.id, seoyeon.id, "패드 연습만으로도 충분해요! 리듬감 기르는 데는 패드가 더 좋을 수도 있어요.");

  // p10: Fender Strat 판매
  const c3 = await cmt(p10.id, jiho.id, "픽가드 컬러가 어떻게 되나요? 사진 더 올려주실 수 있나요?");
  await cmt(p10.id, minjun.id, "화이트 픽가드입니다! 오늘 저녁에 추가 사진 올릴게요.", c3.id);
  await cmt(p10.id, jiho.id, "감사합니다! 사진 보고 연락드릴게요.", c3.id);
  await cmt(p10.id, seoyeon.id, "직거래 위치가 강남이라고 하셨는데 홍대도 가능할까요?");
  await cmt(p10.id, minjun.id, "홍대도 가능합니다! 쪽지 주시면 일정 맞춰볼게요.");
  await cmt(p10.id, taeyang.id, "트레몰로 암 포함인가요?");

  // p18: 인디 밴드 드러머 모집
  const c4 = await cmt(p18.id, seoyeon.id, "관심 있어요! 어떤 음악 좋아하시는지 더 알 수 있을까요?");
  await cmt(p18.id, jiho.id, "Radiohead, The National, Bon Iver 같은 스타일 좋아해요. 비슷한 취향이신가요?", c4.id);
  await cmt(p18.id, seoyeon.id, "오 완전 제 취향이에요! DM 드려도 될까요?", c4.id);
  await cmt(p18.id, taeyang.id, "저도 그 밴드들 좋아하는데 드러머 뽑히길 응원해요 ㅎㅎ", c4.id);
  await cmt(p18.id, minjun.id, "밴드 컨셉 너무 좋아요. 나중에 세션으로 참여 기회 있으면 알려주세요!");
  await cmt(p18.id, yuna.id, "합주 공간은 어디서 하실 예정인가요? 홍대 스튜디오인가요?");

  // p19: 재즈 밴드 모집
  const c5 = await cmt(p19.id, taeyang.id, "베이시스트 지원하고 싶습니다. 재즈 베이스 3년 경력 있어요!");
  await cmt(p19.id, yuna.id, "반갑습니다! 혹시 연주 영상이나 클립 있으면 보내주실 수 있나요?", c5.id);
  await cmt(p19.id, taeyang.id, "네 있어요! 쪽지로 드릴게요 :)", c5.id);
  await cmt(p19.id, jiho.id, "합주 스튜디오 비용은 멤버끼리 나누는 건가요?");
  await cmt(p19.id, yuna.id, "네, N/1로 나눠요. 1인당 보통 1~2만원 선입니다!");

  // p21: 기타리스트 밴드 합류
  await cmt(p21.id, jiho.id, "포스트록 좋아하는 밴드 만들고 싶었는데! 연락 가능할까요?");
  await cmt(p21.id, seoyeon.id, "저희 밴드 드러머인데요, 기타리스트 찾고 있어요. 쪽지 드려도 될까요?");

  console.log("✅ 댓글·대댓글 완료");
  console.log("\n🎉 더미 데이터 시드 완료!");
  await prisma.$disconnect();
}

main().catch(console.error);
