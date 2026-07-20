import type { IncomingItem } from "./index";

/**
 * HuggingFace Daily Papers + Models — 西方模型/产品 + 社区精选论文
 * 通过 HF 的公开 API 获取 trending papers 和 models
 */
export async function fetchHuggingFace(): Promise<IncomingItem[]> {
  const items: IncomingItem[] = [];

  try {
    // Daily Papers API
    const papersUrl = "https://huggingface.co/api/daily_papers";
    const papersRes = await fetch(papersUrl);
    if (papersRes.ok) {
      const papers = await papersRes.json();
      for (const paper of papers.slice(0, 15)) {
        const p = paper.paper || paper;
        items.push({
          title: p.title || "",
          description: p.summary || p.abstract || "",
          url: p.id ? `https://huggingface.co/papers/${p.id}` : (p.paperUrl || ""),
          source_name: "HuggingFace Daily Papers",
          content_type_hint: "paper",
          journal_or_venue: p.publishedAt ? "HF Daily Papers" : "",
          published_at: p.publishedAt || "",
          region_hint: "western",
        });
      }
    }
  } catch {
    // 静默处理
  }

  return items;
}
