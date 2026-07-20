import { NextResponse } from "next/server";
import { runPeriodicPipeline } from "@/lib/ai/pipeline";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPeriodicPipeline("monthly");
    return NextResponse.json(result);
  } catch (err) {
    console.error("[monthly-report] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
