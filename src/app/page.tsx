import { initDB, getDailyPicks, getDailyReport, getDailyRecommend } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";
import { DailyRecommend } from "@/components/DailyRecommend";
import type { Item } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  await initDB();
  // 默认展示昨天的内容（每天0点更新前一日数据）
  const yesterday = new Date(Date.now() - 86400000);
  const dateStr = yesterday.toISOString().slice(0, 10);
  const [dailyPicks, report, recommended] = await Promise.all([
    getDailyPicks(dateStr),
    getDailyReport(dateStr),
    getDailyRecommend(dateStr),
  ]);

  // 按区域分组
  const cnItems = dailyPicks.filter((i) => i.region === "cn");
  const westernItems = dailyPicks.filter((i) => i.region !== "cn");

  // 无内容时：后台触发采集，前台自动刷新等待
  if (dailyPicks.length === 0) {
    // 服务端 fire-and-forget 触发采集管线
    triggerPipelineInBackground();

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            📅 {dateStr} 日报
          </h1>
        </div>
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">⏳</p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            数据采集中...
          </p>
          <p className="text-sm text-slate-400 mt-2 mb-4">
            系统正在自动抓取并分析昨日 AI4S/AI4SS/AI4R 热点，约需 1-3 分钟。
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">本页每 20 秒自动刷新</span>
          </div>
        </div>
        <meta httpEquiv="refresh" content="20" />
      </div>
    );
  }

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          📅 {dateStr} 日报
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          昨日精选 {dailyPicks.length} 条（中国 {cnItems.length} · 西方 {westernItems.length}）
        </p>
        {report?.summary ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.summary}</p>
        ) : null}
      </div>

      {/* 每日推荐论文 */}
      {recommended ? <DailyRecommend paper={recommended} /> : null}

      {/* 西方 30 条 */}
      {westernItems.length > 0 ? (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">🌍 西方精选</h2>
            <span className="text-xs text-slate-400">({westernItems.length} 条)</span>
          </div>
          <CategoryGroup items={westernItems} />
        </section>
      ) : null}

      {/* 中国 20 条 */}
      {cnItems.length > 0 ? (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">🇨🇳 中国精选</h2>
            <span className="text-xs text-slate-400">({cnItems.length} 条)</span>
          </div>
          <CategoryGroup items={cnItems} />
        </section>
      ) : null}
    </div>
  );
}

/** 服务端后台触发采集（fire-and-forget，不阻塞页面渲染） */
function triggerPipelineInBackground() {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return;

  // 通过 localhost 自调用，Railway 容器内有效
  // Railway 默认 PORT 环境变量
  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/api/cron/daily-fetch?secret=${cronSecret}`;

  // 不 await，点火后立即返回
  fetch(url, { signal: AbortSignal.timeout(5000) }).catch(() => {});
}

/** 在区域内按 category 分组显示 */
function CategoryGroup({ items }: { items: Item[] }) {
  const byCategory: Record<string, Item[]> = {};
  for (const item of items) {
    const cat = item.category || "AI4S";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  const catLabels: Record<string, string> = {
    AI4S: "🔬 AI4S · AI for Science",
    AI4SS: "📊 AI4SS · AI for Social Science",
    AI4R: "🤖 AI4R · AI for Research",
  };

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([cat, catItems]) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-2 pl-1">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {catLabels[cat] || cat}
            </span>
            <span className="text-xs text-slate-400">({catItems.length})</span>
          </div>
          <div className="space-y-2">
            {catItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
