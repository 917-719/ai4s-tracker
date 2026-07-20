import { initDB, searchItems } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: {
    date?: string;
    type?: string;
    category?: string;
    region?: string;
    q?: string;
    page?: string;
  };
}) {
  await initDB();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { items, total } = await searchItems({
    date: searchParams.date,
    content_type: searchParams.type,
    category: searchParams.category,
    region: searchParams.region,
    query: searchParams.q,
    minScore: undefined,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        📁 归档搜索
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        共 {total} 条条目
      </p>

      {/* 筛选栏 */}
      <form className="card mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">日期</label>
            <input
              type="date"
              name="date"
              defaultValue={searchParams.date || ""}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
            <select
              name="type"
              defaultValue={searchParams.type || ""}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">全部</option>
              <option value="paper">论文</option>
              <option value="model-product">模型/产品</option>
              <option value="institutional-news">机构/政策</option>
              <option value="investment-news">产业/投资</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">分类</label>
            <select
              name="category"
              defaultValue={searchParams.category || ""}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">全部</option>
              <option value="AI4S">AI4S</option>
              <option value="AI4SS">AI4SS</option>
              <option value="AI4R">AI4R</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">地域</label>
            <select
              name="region"
              defaultValue={searchParams.region || ""}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">全部</option>
              <option value="cn">🇨🇳 中国</option>
              <option value="western">🌍 欧美</option>
              <option value="global">🌐 全球</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">关键词</label>
            <input
              type="text"
              name="q"
              placeholder="搜索标题/摘要..."
              defaultValue={searchParams.q || ""}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          筛选
        </button>
      </form>

      {/* 结果列表 */}
      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-500 dark:text-slate-400">没有找到匹配的结果</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 ? (
            <a
              href={`/archive?${buildQuery(searchParams, { page: String(page - 1) })}`}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ← 上一页
            </a>
          ) : null}
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <a
              href={`/archive?${buildQuery(searchParams, { page: String(page + 1) })}`}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              下一页 →
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function buildQuery(
  existing: Record<string, string | undefined>,
  overrides: Record<string, string>
): string {
  const params = new URLSearchParams();
  const merged = { ...existing, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  return params.toString();
}
