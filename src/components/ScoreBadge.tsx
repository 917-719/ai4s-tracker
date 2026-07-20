export function ScoreBadge({ score }: { score: number }) {
  const level = score >= 8 ? "high" : score >= 5 ? "mid" : "low";
  const colors = {
    high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    mid: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    low: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${colors[level]}`}>
      📊 {score.toFixed(1)}
    </span>
  );
}
