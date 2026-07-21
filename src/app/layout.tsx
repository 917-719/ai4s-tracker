import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI4S Tracker — AI for Science 热点追踪",
  description: "每日追踪 AI4S、AI4SS、AI4R 最新论文、模型、机构动态与产业投资，自动生成日报/周报/月报",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              🔬 AI4S Tracker
            </a>
            <div className="flex items-center gap-1 text-sm font-medium">
              <a href="/" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">日报</a>
              <a href="/weekly" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">周报</a>
              <a href="/monthly" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">月报</a>
              <a href="/favorites" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">⭐ 收藏</a>
              <a href="/archive" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">归档</a>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-700 mt-12 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          AI4S Tracker — 每日 0:00 (北京时间) 自动更新 · Powered by DeepSeek V4
        </footer>
      </body>
    </html>
  );
}
