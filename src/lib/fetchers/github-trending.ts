import type { IncomingItem } from "./index";

/**
 * GitHub Trending — AI4S 相关仓库
 * 通过 GitHub API 搜索最近创建的 AI4S/AI4Science 相关 repo
 */
export async function fetchGithubTrending(): Promise<IncomingItem[]> {
  const items: IncomingItem[] = [];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const queries = [
    "AI4Science",
    "AI+for+Science",
    "scientific+ML",
    "drug+discovery+AI",
    "protein+design+AI",
    "computational+social+science",
    "automated+research",
  ];

  for (const q of queries) {
    try {
      const url = `https://api.github.com/search/repositories?q=${q}+created:>${yesterday}&sort=stars&order=desc&per_page=5`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ai4s-tracker/1.0",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      for (const repo of data.items || []) {
        items.push({
          title: `${repo.full_name}${repo.description ? ` — ${repo.description.slice(0, 100)}` : ""}`,
          description: repo.description || "",
          url: repo.html_url,
          source_name: "GitHub Trending",
          content_type_hint: "model-product",
          journal_or_venue: `GitHub ⭐${repo.stargazers_count}`,
          published_at: repo.created_at,
          region_hint: "western",
        });
      }
    } catch {
      // 静默处理
    }
  }

  return items;
}
