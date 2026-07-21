import { initDB, getFavorites } from "@/lib/db";
import { ItemCard } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  await initDB();
  const items = await getFavorites();

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">⭐ 收藏夹</h1>
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-slate-500 dark:text-slate-400">还没有收藏任何内容</p>
          <p className="text-sm text-slate-400 mt-1">点击任意卡片上的"收藏"按钮，永久保存精彩内容</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        ⭐ 收藏夹
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        共 {items.length} 篇 · 永久保存 · 不会被清理
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
