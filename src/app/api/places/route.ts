import { NextRequest, NextResponse } from "next/server";

export interface PlaceResult {
  name: string;
  roadAddress: string;
  address: string;
  category: string;
  telephone: string;
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

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=8&sort=random`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();
  const places: PlaceResult[] = (data.items ?? []).map((item: any) => ({
    name: stripHtml(item.title ?? ""),
    roadAddress: item.roadAddress ?? "",
    address: item.address ?? "",
    category: item.category ?? "",
    telephone: item.telephone ?? "",
  }));

  return NextResponse.json(places);
}
