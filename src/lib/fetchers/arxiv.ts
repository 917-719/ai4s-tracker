import type { IncomingItem } from "./index";

/**
 * arXiv API 抓取 — 搜索 AI4S/AI4SS/AI4R 相关论文
 * 搜索多个分类 + 关键词组合
 */
export async function fetchArxiv(): Promise<IncomingItem[]> {
  const queries = [
    // AI4S 相关
    'cat:cs.AI+AND+all:"AI for Science"',
    'cat:cs.LG+AND+all:"scientific discovery"',
    'cat:cs.AI+AND+all:"foundation model"+AND+all:"science"',
    'cat:physics.comp-ph+AND+all:"machine learning"',
    'cat:q-bio+AND+all:"deep learning"',
    'cat:cs.LG+AND+all:"drug discovery"',
    'cat:cs.LG+AND+all:"protein"',
    'cat:cs.AI+AND+all:"materials"',
    'cat:cs.LG+AND+all:"climate"',
    // AI4SS 相关
    'cat:cs.CL+AND+all:"social science"',
    'cat:cs.AI+AND+all:"computational social science"',
    'cat:cs.CL+AND+all:"sociology"+OR+all:"economics"',
    // AI4R 相关
    'cat:cs.AI+AND+all:"automated research"',
    'cat:cs.CL+AND+all:"literature review"+AND+all:"AI"',
    'cat:cs.AI+AND+all:"hypothesis generation"',
    'cat:cs.AI+AND+all:"AI scientist"',
  ];

  const allItems: IncomingItem[] = [];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  for (const query of queries) {
    try {
      const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
      const res = await fetch(url, { headers: { "Accept": "application/atom+xml" } });

      if (!res.ok) continue;

      const xml = await res.text();
      const entries = parseArxivAtom(xml);

      for (const entry of entries) {
        allItems.push({
          title: entry.title,
          description: entry.summary,
          url: entry.link,
          source_name: "arXiv",
          content_type_hint: "paper",
          journal_or_venue: "arXiv (预印本)",
          published_at: entry.published,
          region_hint: "western", // arXiv 以欧美为主
        });
      }
    } catch {
      // 单条查询失败不影响其他查询
    }
  }

  return allItems;
}

interface ArxivEntry {
  title: string;
  summary: string;
  link: string;
  published: string;
}

/** 简单解析 arXiv Atom XML 响应 */
function parseArxivAtom(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const title = extractTag(entry, "title");
    const summary = extractTag(entry, "summary");
    const link = extractAttr(entry, "link", "href");
    const published = extractTag(entry, "published");

    if (title && summary && link) {
      entries.push({
        title: cleanText(title),
        summary: cleanText(summary),
        link,
        published: published || new Date().toISOString(),
      });
    }
  }

  return entries;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1] : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const m = xml.match(regex);
  return m ? m[1] : "";
}

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
