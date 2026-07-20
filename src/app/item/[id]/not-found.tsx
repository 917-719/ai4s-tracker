import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🔍</p>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">条目未找到</h2>
      <p className="text-sm text-slate-400 mb-4">该条目可能已被删除或 ID 不正确。</p>
      <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
        ← 返回首页
      </Link>
    </div>
  );
}
