const ADJECTIVES = [
  "감각적인", "용감한", "신비로운", "활발한", "차분한",
  "영리한", "따뜻한", "날렵한", "포근한", "우아한",
  "발랄한", "지혜로운", "섬세한", "강인한", "명랑한",
  "고요한", "유쾌한", "화려한", "순수한", "독특한",
  "씩씩한", "느긋한", "귀여운", "빠른", "반짝이는",
  "다정한", "자유로운", "산뜻한", "기운찬", "온화한",
];

const NOUNS = [
  "기린", "펭귄", "여우", "수달", "판다",
  "코알라", "돌고래", "부엉이", "해달", "라마",
  "카피바라", "미어캣", "토끼", "알파카", "오리",
  "플루트", "기타", "드럼", "바이올린", "트럼펫",
  "별", "파도", "구름", "숲", "달빛",
  "카메라", "노트", "로켓", "버블", "피아노",
];

export function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export async function generateUniqueNickname(
  exists: (name: string) => Promise<boolean>,
  base?: string,
): Promise<string> {
  const candidate = base ?? generateRandomNickname();
  if (!(await exists(candidate))) return candidate;

  for (let i = 2; i <= 999; i++) {
    const withNum = `${candidate}${i}`;
    if (!(await exists(withNum))) return withNum;
  }
  // 극히 드문 경우 새 랜덤 베이스로 재시도
  return generateUniqueNickname(exists);
}
