import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/ai/pipeline";
import { fetchAllSources } from "@/lib/fetchers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && querySecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 立刻返回，pipeline 在后台异步跑（Railway 30s 超时解决）
  runDailyPipeline(fetchAllSources)
    .then((r) => console.log("[Pipeline] Done:", JSON.stringify(r)))
    .catch((e) => console.error("[Pipeline] Error:", e));

  return NextResponse.json({ status: "started", message: "Pipeline running in background, check back in 2-3 minutes" });
}
