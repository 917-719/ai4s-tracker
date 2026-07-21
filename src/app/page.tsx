import { initDB, getDailyPicks, getDailyReport, getDailyRecommend } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";
import { DailyRecommend } from "@/components/DailyRecommend";
import { TriggerButton } from "@/components/TriggerButton";
import type { Item } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  await initDB();
  const yesterday = new Date(Date.now() - 86400000);
  const dateStr = yesterday.toISOString().slice(0, 10);
  const [dailyPicks, report, recommended] = await Promise.all([
    getDailyPicks(dateStr),
    getDailyReport(dateStr),
    getDailyRecommend(dateStr),
  ]);

  const cnItems = dailyPicks.filter((i) => i.region === "cn");
  const westernItems = dailyPicks.filter((i) => i.region !== "cn");

  if (dailyPicks.length === 0) {
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
            昨日数据尚未生成
          </p>
          <p className="text-sm text-slate-400 mt-2 mb-2">
            每日 0:00（北京时间）自动采集，早上起来直接看即可。
          </p>
          <p className="text-sm text-slate-400 mb-4">
            如果已经是上午仍未更新，可手动触发采集：
          </p>
          <TriggerButton />
          <p className="text-xs text-slate-400 mt-4">
            采集约需 1-3 分钟，点击后页面每 20 秒自动刷新直到数据就绪。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
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

      {recommended ? <DailyRecommend paper={recommended} /> : null}

      {westernItems.length > 0 ? (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">🌍 西方精选</h2>
            <span className="text-xs text-slate-400">({westernItems.length} 条)</span>
          </div>
          <CategoryGroup items={westernItems} />
        </section>
      ) : null}

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
