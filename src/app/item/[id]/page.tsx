import { initDB, getPool } from "@/lib/db";
import { ScoreBadge } from "@/components/ScoreBadge";
import { TypeTag } from "@/components/TypeTag";
import { CategoryTag } from "@/components/CategoryTag";
import { RegionTag } from "@/components/RegionTag";
import type { Item } from "@/lib/db/schema";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getItem(id: string): Promise<Item | null> {
  try {
    const p = getPool();
    const r = await p.query("SELECT * FROM items WHERE id = $1 LIMIT 1", [id]);
    return (r.rows[0] as Item) || null;
  } catch {
    return null;
  }
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  await initDB();
  const item = await getItem(params.id);

  if (!item) {
    notFound();
  }

  const breakdown = JSON.parse(item.score_breakdown || "{}");

  return (
    <div className="max-w-3xl">
      {/* 返回链接 */}
      <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
        ← 返回日报
      </a>

      {/* 标签区 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <TypeTag type={item.content_type} />
        <CategoryTag category={item.category} />
        <RegionTag region={item.region} />
        <ScoreBadge score={item.score} />
        {item.is_daily_recommended ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
            ⭐ 今日推荐
          </span>
        ) : null}
      </div>

      {/* 标题 */}
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-snug">
        {item.title}
      </h1>

      {/* 评分明细 */}
      {Object.keys(breakdown).length > 0 ? (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            📊 评分明细
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(breakdown).map(([key, val], i) => (
              <div key={key} className="text-center">
                <div className={`text-2xl font-bold ${
                  Number(val) >= 8 ? "text-emerald-600" : Number(val) >= 5 ? "text-amber-600" : "text-gray-500"
                }`}>
                  {Number(val).toFixed(0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {["来源权威性", "内容质量", "前沿重要性"][i] || key}
                </div>
              </div>
            ))}
          </div>
          {item.score_reason ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              {item.score_reason}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* 中文摘要 */}
      {item.summary_cn ? (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            📝 中文摘要
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.summary_cn}</p>
        </div>
      ) : null}

      {/* 核心要点 */}
      {item.key_point ? (
        <div className="card mb-4 border-l-4 border-blue-400">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            💡 一句话要点
          </h2>
          <p className="text-base font-medium text-slate-800 dark:text-slate-200">{item.key_point}</p>
        </div>
      ) : null}

      {/* 原文链接 */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          🔗 来源信息
        </h2>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-400">来源：</span>{item.source_name}</p>
          {item.journal_or_venue ? <p><span className="text-slate-400">期刊/平台：</span>{item.journal_or_venue}</p> : null}
          {item.authors_or_org ? <p><span className="text-slate-400">作者/机构：</span>{item.authors_or_org}</p> : null}
          {item.published_at ? <p><span className="text-slate-400">发布时间：</span>{item.published_at}</p> : null}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          🔗 查看原文 →
        </a>
      </div>
    </div>
  );
}
