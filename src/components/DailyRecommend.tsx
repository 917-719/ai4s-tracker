import type { Item } from "@/lib/db/schema";
import { ScoreBadge } from "./ScoreBadge";
import { CategoryTag } from "./CategoryTag";
import { RegionTag } from "./RegionTag";

export function DailyRecommend({ paper }: { paper: Item }) {
  return (
    <div className="card-hero ring-2 p-6 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⭐</span>
        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
          今日推荐论文
        </span>
        <ScoreBadge score={paper.score} />
      </div>

      <a href={`/item/${paper.id}`} className="block group">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-3">
          {paper.title}
        </h2>
      </a>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{paper.summary_cn}</p>

      {paper.score_reason ? (
        <div className="bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg p-3 mb-3">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">📝 推荐理由：</span>
          <span className="text-sm text-emerald-800 dark:text-emerald-300">{paper.score_reason}</span>
        </div>
      ) : null}

      {paper.key_point ? (
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-l-2 border-emerald-400 pl-2 mb-3">
          💡 {paper.key_point}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CategoryTag category={paper.category} />
        <RegionTag region={paper.region} />
        <span className="text-xs text-slate-400">{paper.source_name}</span>
        {paper.journal_or_venue ? (
          <span className="text-xs text-slate-400">· {paper.journal_or_venue}</span>
        ) : null}
      </div>
    </div>
  );
}
