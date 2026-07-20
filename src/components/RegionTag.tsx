const REGION_CONFIG: Record<string, { label: string; flag: string }> = {
  cn: { label: "中国", flag: "🇨🇳" },
  western: { label: "欧美", flag: "🌍" },
  global: { label: "全球", flag: "🌐" },
};

export function RegionTag({ region }: { region: string }) {
  const config = REGION_CONFIG[region] || { label: region, flag: "📍" };

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
      {config.flag} {config.label}
    </span>
  );
}
