import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currency";
import { createClient } from "@/lib/supabase/server";

const supported: string[] = CURRENCIES.map((c) => c.code);

type RatesResponse = {
  rates?: Record<string, number>;
  time_last_update_unix?: number;
};

export async function GET(request: Request) {
  // Faqat tizimga kirgan foydalanuvchilar uchun
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!supported.includes(from) || !supported.includes(to)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({ rate: 1, updatedAt: null });
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error("Rate service error");

    const data = (await response.json()) as RatesResponse;
    const fromRate = data.rates?.[from];
    const toRate = data.rates?.[to];

    if (
      typeof fromRate !== "number" ||
      typeof toRate !== "number" ||
      fromRate <= 0
    ) {
      throw new Error("Rate not available");
    }

    return NextResponse.json({
      rate: Number((toRate / fromRate).toPrecision(10)),
      updatedAt: data.time_last_update_unix
        ? new Date(data.time_last_update_unix * 1000).toISOString()
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load exchange rate" },
      { status: 502 }
    );
  }
}