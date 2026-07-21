import { NextResponse } from "next/server";
import { getPool, initDB } from "@/lib/db";
import { Pool } from "pg";

export const runtime = "nodejs";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. 环境变量检查
  results.has_database_url = Boolean(process.env.DATABASE_URL);
  results.has_deepseek_key = Boolean(process.env.DEEPSEEK_API_KEY);
  results.db_url_prefix = process.env.DATABASE_URL?.slice(0, 30) + "...";

  // 2. 数据库连接测试
  try {
    const p = getPool();
    const r = await p.query("SELECT 1 as ok");
    results.db_connect = "OK";
    results.db_result = r.rows[0];
  } catch (e) {
    results.db_connect = "FAILED";
    results.db_error = String(e).slice(0, 300);
  }

  // 3. 表检查
  try {
    await initDB();
    const p = getPool();
    const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    results.tables = tables.rows.map((r) => r.table_name);

    // 检查 items 表行数
    const count = await p.query("SELECT COUNT(*) as cnt FROM items");
    results.items_count = Number(count.rows[0]?.cnt ?? 0);

    // 检查 items 表结构（列名）
    const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'items'");
    results.items_columns = cols.rows.map((r) => r.column_name);

    // 检查最近 3 天的 items
    const recent = await p.query(
      "SELECT fetched_at::date as d, COUNT(*) as cnt FROM items GROUP BY d ORDER BY d DESC LIMIT 5"
    );
    results.items_by_date = recent.rows;
  } catch (e) {
    results.table_check = "FAILED";
    results.table_error = String(e).slice(0, 300);
  }

  return NextResponse.json(results);
}
