import type { Item } from "@/lib/db/schema";
import { ScoreBadge } from "./ScoreBadge";
import { TypeTag } from "./TypeTag";
import { CategoryTag } from "./CategoryTag";
import { RegionTag } from "./RegionTag";

export function ItemCard({ item, showScore = true }: { item: Item; showScore?: boolean }) {
  return (
    <a
      href={`/item/${item.id}`}
      className={`card block group ${item.is_daily_recommended ? "card-hero ring-2" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeTag type={item.content_type} />
          <CategoryTag category={item.category} />
          <RegionTag region={item.region} />
          {item.is_daily_recommended ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
              ⭐ 推荐
            </span>
          ) : null}
          {showScore ? <ScoreBadge score={item.score} /> : null}
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-2">
        {item.title}
      </h3>

      {item.summary_cn ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-2">{item.summary_cn}</p>
      ) : null}

      {item.key_point ? (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 border-l-2 border-blue-400 pl-2 mb-2">
          {item.key_point}
        </p>
      ) : null}

      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-3">
        <span>{item.source_name}</span>
        {item.journal_or_venue ? <span>· {item.journal_or_venue}</span> : null}
        {item.authors_or_org ? <span>· {item.authors_or_org}</span> : null}
      </div>
    </a>
  );
}
