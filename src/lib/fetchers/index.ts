import { fetchArxiv } from "./arxiv";
import { fetchHuggingFace } from "./huggingface";
import { fetchGithubTrending } from "./github-trending";
import { fetchRSSSources } from "./rss-sources";

export interface IncomingItem {
  title: string;
  description: string;
  url: string;
  source_name: string;
  content_type_hint?: string;
  journal_or_venue?: string;
  published_at?: string;
  region_hint?: string;
}

/** 合并所有数据源，去重后返回 */
export async function fetchAllSources(): Promise<IncomingItem[]> {
  const fetchers = [
    { name: "arxiv", fn: fetchArxiv, enabled: true },
    { name: "huggingface", fn: fetchHuggingFace, enabled: true },
    { name: "github-trending", fn: fetchGithubTrending, enabled: true },
    { name: "rss-sources", fn: fetchRSSSources, enabled: true },
  ];

  const results: IncomingItem[][] = [];

  for (const fetcher of fetchers) {
    if (!fetcher.enabled) continue;
    try {
      console.log(`[Fetcher] Starting: ${fetcher.name}`);
      const items = await fetcher.fn();
      console.log(`[Fetcher] ${fetcher.name}: ${items.length} items`);
      results.push(items);
    } catch (err) {
      console.error(`[Fetcher] ${fetcher.name} failed:`, err);
    }
  }

  // 合并并按 URL 去重
  const seen = new Set<string>();
  const merged: IncomingItem[] = [];

  for (const batch of results) {
    for (const item of batch) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        merged.push(item);
      }
    }
  }

  console.log(`[Fetcher] Total after merge & dedup: ${merged.length} items`);
  return merged;
}
