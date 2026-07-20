import { NextResponse } from "next/server";
import { initDB, getTodayItems, setDailyRecommend, saveDailyReport, getStatsByDate } from "@/lib/db";
import { generateDailyReport } from "@/lib/ai/daily-report";
import { v4 as uuid } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDB();
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayItems = await getTodayItems(todayStr);

    if (todayItems.length === 0) {
      return NextResponse.json({ message: "No items found for today" });
    }

    const report = await generateDailyReport(todayItems);

    if (report.recommended_paper_id) {
      await setDailyRecommend(report.recommended_paper_id);
    }

    const stats = await getStatsByDate(todayStr);
    await saveDailyReport({
      id: uuid(),
      date: todayStr,
      summary: report.summary,
      stats: JSON.stringify(stats),
      recommended_paper_id: report.recommended_paper_id,
    });

    return NextResponse.json({ success: true, ...report });
  } catch (err) {
    console.error("[daily-report] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
