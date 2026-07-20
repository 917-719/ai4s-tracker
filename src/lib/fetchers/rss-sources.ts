import type { IncomingItem } from "./index";

/**
 * RSS 多源聚合 — 覆盖中西方四类内容
 * 注意：部分 RSS 源可能被墙或限流，每个源独立 try-catch
 */

interface RSSSource {
  name: string;
  url: string;
  content_type_hint: string;
  region_hint: string;
}

const RSS_SOURCES: RSSSource[] = [
  // ===== 西方 — 论文/研究 =====
  { name: "Nature AI", url: "https://www.nature.com/subjects/artificial-intelligence.rss", content_type_hint: "paper", region_hint: "western" },
  { name: "Science AI", url: "https://www.science.org/rss/ahead.xml", content_type_hint: "paper", region_hint: "western" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/feed/", content_type_hint: "paper", region_hint: "western" },

  // ===== 西方 — 模型/产品 =====
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", content_type_hint: "model-product", region_hint: "western" },
  { name: "DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", content_type_hint: "model-product", region_hint: "western" },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/feed/", content_type_hint: "model-product", region_hint: "western" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/feed", content_type_hint: "model-product", region_hint: "western" },
  { name: "Microsoft Research", url: "https://www.microsoft.com/en-us/research/feed/", content_type_hint: "model-product", region_hint: "western" },

  // ===== 西方 — 机构/政策 =====
  { name: "Nature News", url: "https://www.nature.com/nature.rss", content_type_hint: "institutional-news", region_hint: "western" },
  { name: "Science News", url: "https://www.science.org/rss/news_current.xml", content_type_hint: "institutional-news", region_hint: "western" },

  // ===== 西方 — 产业投资 =====
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", content_type_hint: "investment-news", region_hint: "western" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", content_type_hint: "investment-news", region_hint: "western" },

  // ===== 中国 — 论文/研究 =====
  { name: "机器之心", url: "https://rsshub.app/jiqizhixin/latest", content_type_hint: "paper", region_hint: "cn" },

  // ===== 中国 — 模型/产品 =====
  { name: "量子位", url: "https://rsshub.app/quantamagazine/quantamagazine", content_type_hint: "model-product", region_hint: "cn" },

  // ===== 中国 — 机构/政策 =====
  { name: "中国科学报", url: "https://rsshub.app/cas/news", content_type_hint: "institutional-news", region_hint: "cn" },

  // ===== 中国 — 产业投资 =====
  { name: "36Kr AI", url: "https://rsshub.app/36kr/motif/ai", content_type_hint: "investment-news", region_hint: "cn" },
];

/** 从单个 RSS 源抓取条目 */
async function fetchOneRSS(source: RSSSource): Promise<IncomingItem[]> {
  try {
    // 使用 rss2json 服务作为代理（避免浏览器 CORS 和 RSS 解析问题）
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
    const res = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const entries = data.items || [];

    return entries.slice(0, 5).map((entry: Record<string, unknown>) => ({
      title: String(entry.title || ""),
      description: String(entry.description || entry.content || "").replace(/<[^>]+>/g, "").slice(0, 500),
      url: String(entry.link || ""),
      source_name: source.name,
      content_type_hint: source.content_type_hint,
      journal_or_venue: source.name,
      published_at: String(entry.pubDate || new Date().toISOString()),
      region_hint: source.region_hint,
    }));
  } catch {
    return [];
  }
}

/** 抓取所有 RSS 源 */
export async function fetchRSSSources(): Promise<IncomingItem[]> {
  const allItems: IncomingItem[] = [];

  // 逐个抓取（RSS 源少，并行意义不大且可能触发限流）
  for (const source of RSS_SOURCES) {
    const items = await fetchOneRSS(source);
    allItems.push(...items);
  }

  return allItems;
}
