import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/ai/pipeline";
import { fetchAllSources } from "@/lib/fetchers";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max (Vercel Pro)

export async function GET(req: Request) {
  // 简单的 cron 保护
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyPipeline(fetchAllSources);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[daily-fetch] Pipeline error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
