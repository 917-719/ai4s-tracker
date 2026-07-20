import { Pool } from "pg";
import { v4 as uuid } from "uuid";
import { SCHEMA_SQL, type Item, type DailyReport, type PeriodicReport } from "./schema";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable");
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

/** 初始化数据库表（幂等 — IF NOT EXISTS） */
export async function initDB(): Promise<void> {
  const p = getPool();
  await p.query(SCHEMA_SQL);
}

/** 检查 URL 是否已存在 */
export async function urlExists(url: string): Promise<boolean> {
  const p = getPool();
  const r = await p.query("SELECT 1 FROM items WHERE url = $1 LIMIT 1", [url]);
  return (r.rowCount ?? 0) > 0;
}

/** 插入一条条目（URL 冲突则跳过） */
export async function insertItem(item: Omit<Item, "created_at">): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO items (id, title, description, url, source_name, content_type, category, subcategory,
      authors_or_org, journal_or_venue, source_quality, published_at, fetched_at, score, score_breakdown,
      score_reason, summary_cn, key_point, is_daily_recommended, region)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (url) DO NOTHING`,
    [
      item.id || uuid(),
      item.title,
      item.description || "",
      item.url,
      item.source_name,
      item.content_type,
      item.category,
      item.subcategory || "",
      item.authors_or_org || "",
      item.journal_or_venue || "",
      item.source_quality,
      item.published_at || "",
      item.fetched_at || new Date().toISOString(),
      item.score || 0,
      item.score_breakdown || "{}",
      item.score_reason || "",
      item.summary_cn || "",
      item.key_point || "",
      item.is_daily_recommended || 0,
      item.region,
    ]
  );
}

/** 批量插入条目 */
export async function insertItems(items: Omit<Item, "created_at">[]): Promise<number> {
  if (items.length === 0) return 0;
  const p = getPool();
  let count = 0;

  // 逐条插入（ON CONFLICT 需要逐条判断）
  for (const item of items) {
    const r = await p.query(
      `INSERT INTO items (id, title, description, url, source_name, content_type, category, subcategory,
        authors_or_org, journal_or_venue, source_quality, published_at, fetched_at, score, score_breakdown,
        score_reason, summary_cn, key_point, is_daily_recommended, region)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        ON CONFLICT (url) DO NOTHING`,
      [
        item.id || uuid(),
        item.title,
        item.description || "",
        item.url,
        item.source_name,
        item.content_type,
        item.category,
        item.subcategory || "",
        item.authors_or_org || "",
        item.journal_or_venue || "",
        item.source_quality,
        item.published_at || "",
        item.fetched_at || new Date().toISOString(),
        item.score || 0,
        item.score_breakdown || "{}",
        item.score_reason || "",
        item.summary_cn || "",
        item.key_point || "",
        item.is_daily_recommended || 0,
        item.region,
      ]
    );
    if ((r.rowCount ?? 0) > 0) count++;
  }
  return count;
}

/** 查询当日入库的条目 */
export async function getTodayItems(dateStr?: string): Promise<Item[]> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE fetched_at::date = $1::date ORDER BY score DESC, created_at DESC",
    [date]
  );
  return r.rows as Item[];
}

/** 查询某日 score >= minScore 的论文 */
export async function getPapers(dateStr: string, minScore = 5): Promise<Item[]> {
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE content_type = 'paper' AND fetched_at::date = $1::date AND score >= $2 ORDER BY score DESC",
    [dateStr, minScore]
  );
  return r.rows as Item[];
}

/** 查询某时间范围内的条目 */
export async function getItemsInRange(
  startDate: string,
  endDate: string,
  options?: { content_type?: string; minScore?: number; limit?: number }
): Promise<Item[]> {
  const p = getPool();
  const params: (string | number)[] = [startDate, endDate];
  let sql = "SELECT * FROM items WHERE fetched_at::date >= $1::date AND fetched_at::date <= $2::date";
  let paramIdx = 3;

  if (options?.content_type) {
    sql += ` AND content_type = $${paramIdx++}`;
    params.push(options.content_type);
  }
  if (options?.minScore !== undefined) {
    sql += ` AND score >= $${paramIdx++}`;
    params.push(options.minScore);
  }
  sql += " ORDER BY score DESC";
  if (options?.limit) {
    sql += ` LIMIT $${paramIdx++}`;
    params.push(options.limit);
  }

  const r = await p.query(sql, params);
  return r.rows as Item[];
}

/** 设置每日推荐论文（先清除旧推荐，再设新推荐） */
export async function setDailyRecommend(paperId: string): Promise<void> {
  const p = getPool();
  await p.query("UPDATE items SET is_daily_recommended = 0");
  await p.query("UPDATE items SET is_daily_recommended = 1 WHERE id = $1", [paperId]);
}

/** 获取每日推荐论文 */
export async function getDailyRecommend(dateStr?: string): Promise<Item | null> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE is_daily_recommended = 1 AND fetched_at::date = $1::date LIMIT 1",
    [date]
  );
  return (r.rows[0] as Item) || null;
}

/** 保存日报（日期冲突则更新） */
export async function saveDailyReport(report: Omit<DailyReport, "created_at">): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO daily_reports (id, date, summary, stats, recommended_paper_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date) DO UPDATE SET summary = $3, stats = $4, recommended_paper_id = $5`,
    [report.id || uuid(), report.date, report.summary, report.stats, report.recommended_paper_id || null]
  );
}

/** 获取日报 */
export async function getDailyReport(dateStr?: string): Promise<DailyReport | null> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query("SELECT * FROM daily_reports WHERE date = $1 LIMIT 1", [date]);
  return (r.rows[0] as DailyReport) || null;
}

/** 保存周报/月报（冲突则更新） */
export async function savePeriodicReport(report: Omit<PeriodicReport, "created_at">): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO periodic_reports (id, period_start, period_end, report_type, top_items, trend_summary, literature_review)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (period_start, period_end, report_type) DO UPDATE
      SET top_items = $5, trend_summary = $6, literature_review = $7`,
    [report.id || uuid(), report.period_start, report.period_end, report.report_type, report.top_items, report.trend_summary, report.literature_review]
  );
}

/** 获取最新的周报或月报 */
export async function getLatestPeriodicReport(type: "weekly" | "monthly"): Promise<PeriodicReport | null> {
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM periodic_reports WHERE report_type = $1 ORDER BY created_at DESC LIMIT 1",
    [type]
  );
  return (r.rows[0] as PeriodicReport) || null;
}

/** 获取所有周报/月报列表 */
export async function getPeriodicReports(type: "weekly" | "monthly", limit = 20): Promise<PeriodicReport[]> {
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM periodic_reports WHERE report_type = $1 ORDER BY created_at DESC LIMIT $2",
    [type, limit]
  );
  return r.rows as PeriodicReport[];
}

/** 按条件查询条目（归档页用） */
export async function searchItems(params: {
  date?: string;
  content_type?: string;
  category?: string;
  region?: string;
  minScore?: number;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Item[]; total: number }> {
  const p = getPool();
  const conditions: string[] = [];
  const args: (string | number)[] = [];
  let idx = 1;

  if (params.date) {
    conditions.push(`fetched_at::date = $${idx++}::date`);
    args.push(params.date);
  }
  if (params.content_type) {
    conditions.push(`content_type = $${idx++}`);
    args.push(params.content_type);
  }
  if (params.category) {
    conditions.push(`category = $${idx++}`);
    args.push(params.category);
  }
  if (params.region) {
    conditions.push(`region = $${idx++}`);
    args.push(params.region);
  }
  if (params.minScore !== undefined) {
    conditions.push(`score >= $${idx++}`);
    args.push(params.minScore);
  }
  if (params.query) {
    conditions.push(`(title ILIKE $${idx} OR summary_cn ILIKE $${idx + 1})`);
    const q = `%${params.query}%`;
    args.push(q, q);
    idx += 2;
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const countR = await p.query(`SELECT COUNT(*) as total FROM items ${where}`, args);
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await p.query(
    `SELECT * FROM items ${where} ORDER BY fetched_at DESC, score DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...args, limit, offset]
  );

  return { items: r.rows as Item[], total };
}

/** 按内容类型+地域分组统计 */
export async function getStatsByDate(dateStr: string): Promise<Record<string, Record<string, number>>> {
  const p = getPool();
  const r = await p.query(
    `SELECT content_type, region, COUNT(*) as cnt FROM items
      WHERE fetched_at::date = $1::date GROUP BY content_type, region`,
    [dateStr]
  );
  const stats: Record<string, Record<string, number>> = {
    paper: { cn: 0, western: 0, global: 0 },
    "model-product": { cn: 0, western: 0, global: 0 },
    "institutional-news": { cn: 0, western: 0, global: 0 },
    "investment-news": { cn: 0, western: 0, global: 0 },
  };
  for (const row of r.rows) {
    const type = row.content_type as string;
    const region = row.region as string;
    if (stats[type] && region in stats[type]) {
      stats[type][region] = Number(row.cnt);
    }
  }
  return stats;
}

/** 获取底层 Pool（供需要直接查询的页面使用） */
export { getPool };
