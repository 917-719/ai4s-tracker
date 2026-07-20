import { initDB, getTodayItems, getDailyReport, getDailyRecommend } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";
import { DailyRecommend } from "@/components/DailyRecommend";
import { TypeTag } from "@/components/TypeTag";
import type { Item } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  await initDB();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [todayItems, report, recommended] = await Promise.all([
    getTodayItems(todayStr),
    getDailyReport(todayStr),
    getDailyRecommend(todayStr),
  ]);

  // 按类型分组
  const papers = todayItems.filter((i) => i.content_type === "paper");
  const models = todayItems.filter((i) => i.content_type === "model-product");
  const institutions = todayItems.filter((i) => i.content_type === "institutional-news");
  const investments = todayItems.filter((i) => i.content_type === "investment-news");

  return (
    <div>
      {/* 日期标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          📅 {todayStr} 日报
        </h1>
        {report?.summary ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.summary}</p>
        ) : null}
      </div>

      {/* 今日没有内容 */}
      {todayItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🔬</p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">今日数据收集中...</p>
          <p className="text-sm text-slate-400 mt-2">
            每日 0:00 (北京时间) 自动更新。如果没有看到内容，可能是今天的更新任务尚未执行。
          </p>
        </div>
      ) : (
        <>
          {/* 每日推荐 */}
          {recommended ? <DailyRecommend paper={recommended} /> : null}

          {/* 四类内容分区块展示 */}
          <ContentSection title="📄 最新论文" items={papers} type="paper" />
          <ContentSection title="🤖 模型与产品" items={models} type="model-product" />
          <ContentSection title="🏛️ 机构与政策" items={institutions} type="institutional-news" />
          <ContentSection title="💰 产业与投资" items={investments} type="investment-news" />
        </>
      )}
    </div>
  );
}

function ContentSection({
  title,
  items,
  type,
}: {
  title: string;
  items: Item[];
  type: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        <TypeTag type={type} />
        <span className="text-xs text-slate-400">({items.length})</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
