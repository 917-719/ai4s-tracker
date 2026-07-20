const CAT_CONFIG: Record<string, { color: string }> = {
  AI4S: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  AI4SS: { color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  AI4R: { color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
};

export function CategoryTag({ category }: { category: string }) {
  const config = CAT_CONFIG[category] || { color: "bg-gray-100 text-gray-600" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.color}`}>
      {category}
    </span>
  );
}
