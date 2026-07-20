const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  paper: { label: "论文", icon: "📄", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "model-product": { label: "模型/产品", icon: "🤖", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "institutional-news": { label: "机构/政策", icon: "🏛️", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  "investment-news": { label: "产业/投资", icon: "💰", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export function TypeTag({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || { label: type, icon: "📌", color: "bg-gray-100 text-gray-600" };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}
