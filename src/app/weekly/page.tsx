import { initDB, getLatestPeriodicReport, getPeriodicReports, getItemsInRange } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";
import { LiteratureReview } from "@/components/LiteratureReview";
import type { Item, LiteratureReview as LRType } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  await initDB();
  const report = await getLatestPeriodicReport("weekly");
  const allReports = await getPeriodicReports("weekly", 10);

  if (!report) {
    return (
      <div className="card text-center py-12">
        <p className="text-5xl mb-4">📊</p>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">暂无周报</p>
        <p className="text-sm text-slate-400 mt-2">每周一凌晨 1:00 (北京时间) 自动生成。请在首批数据运行一周后再来查看。</p>
      </div>
    );
  }

  const topItems: Item[] = JSON.parse(report.top_items || "[]");
  const literatureReview: LRType = JSON.parse(report.literature_review || "{}");

  // 拉取 TOP items 的完整数据
  let fullItems: Item[] = [];
  if (topItems.length > 0) {
    fullItems = await getItemsInRange(report.period_start, report.period_end, { limit: 20 });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        📊 周报
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {report.period_start} → {report.period_end}
      </p>

      {/* 趋势概述 */}
      {report.trend_summary ? (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">📈 本周趋势</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.trend_summary}</p>
        </div>
      ) : null}

      {/* 高分论文列表 */}
      {fullItems.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">🏆 本周精选</h2>
          <div className="space-y-3">
            {fullItems.slice(0, 10).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 文献综述 */}
      {literatureReview.frontier_topics?.length > 0 ||
      literatureReview.competing_viewpoints?.length > 0 ||
      literatureReview.open_problems?.length > 0 ? (
        <LiteratureReview review={literatureReview} />
      ) : null}

      {/* 历史周报 */}
      {allReports.length > 1 ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">📁 历史周报</h2>
          <div className="space-y-2">
            {allReports.slice(1).map((r) => (
              <div key={r.id} className="card">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {r.period_start} → {r.period_end}
                </span>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.trend_summary}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
