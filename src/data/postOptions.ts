export const PRICE_TYPES = [
  { id: "free",        label: "무료",   hasAmount: false },
  { id: "monthly",     label: "월정액", hasAmount: true  },
  { id: "yearly",      label: "년",     hasAmount: true  },
  { id: "per_session", label: "회당",   hasAmount: true  },
  { id: "negotiable",  label: "협의",   hasAmount: false },
] as const;

export type PriceTypeId = (typeof PRICE_TYPES)[number]["id"];

export function generatePriceDisplay(typeId: string, amount: string): string {
  const num = parseInt(amount.replace(/[^0-9]/g, ""), 10);
  const fmt = isNaN(num) ? "0" : num.toLocaleString("ko-KR");
  switch (typeId) {
    case "free":        return "무료";
    case "monthly":     return `월 ${fmt}원`;
    case "yearly":      return `년 ${fmt}원`;
    case "per_session": return `회당 ${fmt}원`;
    case "negotiable":  return "협의";
    default:            return "";
  }
}

export const SLIDER_MAX = 2_000_000;

// 가격을 숫자로 비교할 수 없는 "협의" 게시글을 가리키는 sentinel 값
export const NEGOTIABLE_PRICE = -1;

export const PRICE_RANGES = [
  { id: "free",       label: "무료",       min: 0,       max: 0 },
  { id: "negotiable", label: "협의",       min: NEGOTIABLE_PRICE, max: NEGOTIABLE_PRICE },
  { id: "u5",         label: "5만원 이하",  min: 0,       max: 50_000 },
  { id: "5to10",      label: "5~10만원",   min: 50_000,  max: 100_000 },
  { id: "10to15",     label: "10~15만원",  min: 100_000, max: 150_000 },
  { id: "15to20",     label: "15~20만원",  min: 150_000, max: 200_000 },
  { id: "20to50",     label: "20~50만원",  min: 200_000, max: 500_000 },
  { id: "o50",        label: "50만원 이상", min: 500_000, max: Infinity },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export function parsePrice(priceDisplay: string): number {
  if (/무료/.test(priceDisplay)) return 0;
  const num = priceDisplay.replace(/[^0-9]/g, "");
  return num ? parseInt(num) : -1;
}

export const EMOJIS = [
  "🎸",
  "🥁",
  "🎤",
  "🎹",
  "🎵",
  "🎷",
  "🎻",
  "🎧",
  "🎺",
  "🪗",
  "🎼",
  "🎙️",
];
