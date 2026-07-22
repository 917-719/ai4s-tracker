import { NextResponse } from "next/server";
import { getPool, initDB } from "@/lib/db";

export const runtime = "nodejs";

/** 补救端点：为指定日期标记精选 50 条（临时用，修复历史数据） */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date") || new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  await initDB();
  const p = getPool();

  // 清除旧标记
  await p.query("UPDATE items SET is_daily_pick = 0 WHERE fetched_at::date = $1::date", [dateStr]);

  // 西方前30 + 中国前20，各自按 score 降序（去重：排除前日已出现过的 URL）
  await p.query(`
    UPDATE items SET is_daily_pick = 1 WHERE id IN (
      SELECT id FROM items WHERE region <> 'cn' AND fetched_at::date = $1::date
        AND url NOT IN (SELECT url FROM items WHERE fetched_at::date < $1::date)
      ORDER BY score DESC LIMIT 30
    )
  `, [dateStr]);

  await p.query(`
    UPDATE items SET is_daily_pick = 1 WHERE id IN (
      SELECT id FROM items WHERE region = 'cn' AND fetched_at::date = $1::date
        AND url NOT IN (SELECT url FROM items WHERE fetched_at::date < $1::date)
      ORDER BY score DESC LIMIT 20
    )
  `, [dateStr]);

  // 确认结果
  const r = await p.query(
    "SELECT COUNT(*) as cnt FROM items WHERE is_daily_pick = 1 AND fetched_at::date = $1::date",
    [dateStr]
  );

  return NextResponse.json({
    date: dateStr,
    picks_marked: Number(r.rows[0]?.cnt ?? 0),
  });
}
