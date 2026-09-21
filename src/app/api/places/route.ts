import { NextRequest, NextResponse } from "next/server";

export interface PlaceResult {
  name: string;
  roadAddress: string;
  address: string;
  category: string;
  telephone: string;
  lat?: number;
  lng?: number;
}

const stripHtml = (str: string) => str.replace(/<[^>]+>/g, "");

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "search provider not configured" }, { status: 500 });
  }

  const url = `https://naverapihub.apigw.ntruss.com/search/v1/local?query=${encodeURIComponent(q)}&display=5&sort=random`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const places: PlaceResult[] = (data.items ?? []).map((item: any) => {
      const rawX = parseFloat(item.mapx ?? "0");
      const rawY = parseFloat(item.mapy ?? "0");
      // API HUB는 실수 WGS84값 반환; 구 API는 정수 × 10^7 — 180 초과 시 변환
      const lng = rawX ? (rawX > 180 ? rawX / 1e7 : rawX) : undefined;
      const lat = rawY ? (rawY > 90 ? rawY / 1e7 : rawY) : undefined;
      return {
        name: stripHtml(item.title ?? ""),
        roadAddress: item.roadAddress ?? "",
        address: item.address ?? "",
        category: item.category ?? "",
        telephone: item.telephone ?? "",
        lng,
        lat,
      };
    });

    return NextResponse.json(places);
  } catch {
    return NextResponse.json([]);
  }
}
