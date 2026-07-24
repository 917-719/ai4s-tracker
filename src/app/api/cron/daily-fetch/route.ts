import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/ai/pipeline";
import { fetchAllSources } from "@/lib/fetchers";

export const runtime = "nodejs";

let lastRun = 0; // 内存时间戳，防止短时间内重复触发

export async function GET(req: Request) {
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthed = cronSecret && querySecret === cronSecret;

  // 未认证请求（AutoTrigger）：6小时内已跑过就跳过，防止反复触发
  if (!isAuthed) {
    const cooldownMs = 6 * 3600000;
    if (Date.now() - lastRun < cooldownMs) {
      return NextResponse.json({ status: "skipped", message: `Pipeline already ran ${Math.round((Date.now() - lastRun) / 60000)} min ago` });
    }
  }

  lastRun = Date.now();

  // 立刻返回，pipeline 在后台异步跑
  runDailyPipeline(fetchAllSources)
    .then((r) => console.log("[Pipeline] Done:", JSON.stringify(r)))
    .catch((e) => console.error("[Pipeline] Error:", e));

  return NextResponse.json({ status: "started", message: "Pipeline running in background, check back in 2-3 minutes" });
}
