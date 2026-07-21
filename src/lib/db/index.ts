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
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

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

/** 插入一条条目 */
export async function insertItem(item: Omit<Item, "created_at">): Promise<void> {
  const p = getPool();
  const sql = `INSERT INTO items (id, title, description, url, source_name, content_type, category, subcategory,
    authors_or_org, journal_or_venue, source_quality, published_at, fetched_at, score, score_breakdown,
    score_reason, summary_cn, key_point, is_daily_recommended, is_favorited, is_daily_pick, is_compressed, region)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
    ON CONFLICT (url) DO NOTHING`;
  await p.query(sql, [
    item.id || uuid(), item.title, item.description || "", item.url, item.source_name,
    item.content_type, item.category, item.subcategory || "", item.authors_or_org || "",
    item.journal_or_venue || "", item.source_quality, item.published_at || "",
    item.fetched_at || new Date().toISOString(), item.score || 0, item.score_breakdown || "{}",
    item.score_reason || "", item.summary_cn || "", item.key_point || "",
    item.is_daily_recommended || 0, item.is_favorited || 0, item.is_daily_pick || 0,
    item.is_compressed || 0, item.region,
  ]);
}

/** 批量插入条目 */
export async function insertItems(items: Omit<Item, "created_at">[]): Promise<number> {
  if (items.length === 0) return 0;
  const p = getPool();
  let count = 0;
  for (const item of items) {
    const r = await p.query(
      `INSERT INTO items (id, title, description, url, source_name, content_type, category, subcategory,
        authors_or_org, journal_or_venue, source_quality, published_at, fetched_at, score, score_breakdown,
        score_reason, summary_cn, key_point, is_daily_recommended, is_favorited, is_daily_pick, is_compressed, region)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        ON CONFLICT (url) DO NOTHING`,
      [
        item.id || uuid(), item.title, item.description || "", item.url, item.source_name,
        item.content_type, item.category, item.subcategory || "", item.authors_or_org || "",
        item.journal_or_venue || "", item.source_quality, item.published_at || "",
        item.fetched_at || new Date().toISOString(), item.score || 0, item.score_breakdown || "{}",
        item.score_reason || "", item.summary_cn || "", item.key_point || "",
        item.is_daily_recommended || 0, item.is_favorited || 0, item.is_daily_pick || 0,
        item.is_compressed || 0, item.region,
      ]
    );
    if ((r.rowCount ?? 0) > 0) count++;
  }
  return count;
}

export async function getTodayItems(dateStr?: string): Promise<Item[]> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE fetched_at::date = $1::date ORDER BY score DESC, created_at DESC", [date]
  );
  return r.rows as Item[];
}

export async function getPapers(dateStr: string, minScore = 5): Promise<Item[]> {
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE content_type = 'paper' AND fetched_at::date = $1::date AND score >= $2 ORDER BY score DESC",
    [dateStr, minScore]
  );
  return r.rows as Item[];
}

export async function getItemsInRange(
  startDate: string, endDate: string,
  options?: { content_type?: string; minScore?: number; limit?: number }
): Promise<Item[]> {
  const p = getPool();
  const params: (string | number)[] = [startDate, endDate];
  let sql = "SELECT * FROM items WHERE fetched_at::date >= $1::date AND fetched_at::date <= $2::date";
  let idx = 3;
  if (options?.content_type) { sql += ` AND content_type = $${idx++}`; params.push(options.content_type); }
  if (options?.minScore !== undefined) { sql += ` AND score >= $${idx++}`; params.push(options.minScore); }
  sql += " ORDER BY score DESC";
  if (options?.limit) { sql += ` LIMIT $${idx++}`; params.push(options.limit); }
  const r = await p.query(sql, params);
  return r.rows as Item[];
}

export async function setDailyRecommend(paperId: string): Promise<void> {
  const p = getPool();
  await p.query("UPDATE items SET is_daily_recommended = 0");
  await p.query("UPDATE items SET is_daily_recommended = 1 WHERE id = $1", [paperId]);
}

export async function getDailyRecommend(dateStr?: string): Promise<Item | null> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE is_daily_recommended = 1 AND fetched_at::date = $1::date LIMIT 1", [date]
  );
  return (r.rows[0] as Item) || null;
}

export async function saveDailyReport(report: Omit<DailyReport, "created_at">): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO daily_reports (id, date, summary, stats, recommended_paper_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date) DO UPDATE SET summary = $3, stats = $4, recommended_paper_id = $5`,
    [report.id || uuid(), report.date, report.summary, report.stats, report.recommended_paper_id || null]
  );
}

export async function getDailyReport(dateStr?: string): Promise<DailyReport | null> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query("SELECT * FROM daily_reports WHERE date = $1 LIMIT 1", [date]);
  return (r.rows[0] as DailyReport) || null;
}

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

export async function getLatestPeriodicReport(type: "weekly" | "monthly"): Promise<PeriodicReport | null> {
  const p = getPool();
  const r = await p.query("SELECT * FROM periodic_reports WHERE report_type = $1 ORDER BY created_at DESC LIMIT 1", [type]);
  return (r.rows[0] as PeriodicReport) || null;
}

export async function getPeriodicReports(type: "weekly" | "monthly", limit = 20): Promise<PeriodicReport[]> {
  const p = getPool();
  const r = await p.query("SELECT * FROM periodic_reports WHERE report_type = $1 ORDER BY created_at DESC LIMIT $2", [type, limit]);
  return r.rows as PeriodicReport[];
}

export async function searchItems(params: {
  date?: string; content_type?: string; category?: string; region?: string;
  minScore?: number; query?: string; limit?: number; offset?: number;
}): Promise<{ items: Item[]; total: number }> {
  const p = getPool();
  const conditions: string[] = [];
  const args: (string | number)[] = [];
  let idx = 1;
  if (params.date) { conditions.push(`fetched_at::date = $${idx++}::date`); args.push(params.date); }
  if (params.content_type) { conditions.push(`content_type = $${idx++}`); args.push(params.content_type); }
  if (params.category) { conditions.push(`category = $${idx++}`); args.push(params.category); }
  if (params.region) { conditions.push(`region = $${idx++}`); args.push(params.region); }
  if (params.minScore !== undefined) { conditions.push(`score >= $${idx++}`); args.push(params.minScore); }
  if (params.query) { conditions.push(`(title ILIKE $${idx} OR summary_cn ILIKE $${idx + 1})`); args.push(`%${params.query}%`, `%${params.query}%`); idx += 2; }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const countR = await p.query(`SELECT COUNT(*) as total FROM items ${where}`, args);
  const total = Number(countR.rows[0]?.total ?? 0);
  const r = await p.query(`SELECT * FROM items ${where} ORDER BY fetched_at DESC, score DESC LIMIT $${idx++} OFFSET $${idx++}`, [...args, limit, offset]);
  return { items: r.rows as Item[], total };
}

export async function getStatsByDate(dateStr: string): Promise<Record<string, Record<string, number>>> {
  const p = getPool();
  const r = await p.query(
    "SELECT content_type, region, COUNT(*) as cnt FROM items WHERE fetched_at::date = $1::date GROUP BY content_type, region", [dateStr]
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
    if (stats[type] && region in stats[type]) { stats[type][region] = Number(row.cnt); }
  }
  return stats;
}

/** ===== 收藏夹 ===== */
export async function toggleFavorite(id: string): Promise<boolean> {
  const p = getPool();
  const r = await p.query(
    "UPDATE items SET is_favorited = CASE WHEN is_favorited = 1 THEN 0 ELSE 1 END WHERE id = $1 RETURNING is_favorited", [id]
  );
  return (r.rows[0]?.is_favorited ?? 0) === 1;
}

export async function getFavorites(): Promise<Item[]> {
  const p = getPool();
  const r = await p.query("SELECT * FROM items WHERE is_favorited = 1 ORDER BY created_at DESC");
  return r.rows as Item[];
}

/** ===== 每日精选 ===== */
export async function clearDailyPicks(): Promise<void> {
  const p = getPool();
  await p.query("UPDATE items SET is_daily_pick = 0 WHERE is_daily_pick = 1");
}

export async function markDailyPicks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const p = getPool();
  for (const id of ids) {
    await p.query("UPDATE items SET is_daily_pick = 1 WHERE id = $1", [id]);
  }
}

export async function getDailyPicks(dateStr?: string): Promise<Item[]> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const p = getPool();
  const r = await p.query(
    "SELECT * FROM items WHERE is_daily_pick = 1 AND fetched_at::date = $1::date ORDER BY region, score DESC", [date]
  );
  return r.rows as Item[];
}

/** ===== 定期清理 ===== */
export async function compressOldItems(daysOld = 7): Promise<number> {
  const p = getPool();
  const cutoff = new Date(Date.now() - daysOld * 86400000).toISOString().slice(0, 10);
  const r = await p.query(
    `UPDATE items SET description = '', summary_cn = '', score_breakdown = '{}',
      score_reason = '', key_point = '', is_compressed = 1
    WHERE is_favorited = 0 AND is_daily_pick = 0 AND is_compressed = 0
      AND fetched_at::date < $1::date`, [cutoff]
  );
  return r.rowCount ?? 0;
}

export { getPool };
