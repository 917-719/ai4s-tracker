import { chatCompletion } from "./deepseek-client";
import { LITERATURE_REVIEW_SYSTEM } from "./prompts";
import type { Item, LiteratureReview } from "@/lib/db/schema";

/** 基于周期内论文生成文献综述 */
export async function generateLiteratureReview(
  papers: Item[],
  reportType: "weekly" | "monthly"
): Promise<LiteratureReview> {
  if (papers.length < 3) {
    return {
      frontier_topics: [],
      competing_viewpoints: [],
      open_problems: [],
    };
  }

  // 构建精简输入
  const papersForPrompt = papers
    .sort((a, b) => b.score - a.score)
    .slice(0, 40) // 最多取前40篇防止 token 溢出
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      subcategory: p.subcategory,
      region: p.region,
      score: p.score,
      key_point: p.key_point,
      summary_cn: p.summary_cn.slice(0, 150),
    }));

  const periodLabel = reportType === "weekly" ? "本周" : "本月";
  const userContent = `${periodLabel}论文（共${papers.length}篇，取前${papersForPrompt.length}篇高分论文）：\n${JSON.stringify(papersForPrompt, null, 2)}`;

  try {
    const raw = await chatCompletion(
      [
        { role: "system", content: LITERATURE_REVIEW_SYSTEM },
        { role: "user", content: userContent },
      ],
      { temperature: 0.3, max_tokens: 3000 }
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return emptyReview();
    }

    const obj = JSON.parse(jsonMatch[0]);
    return {
      frontier_topics: Array.isArray(obj.frontier_topics) ? obj.frontier_topics : [],
      competing_viewpoints: Array.isArray(obj.competing_viewpoints) ? obj.competing_viewpoints : [],
      open_problems: Array.isArray(obj.open_problems) ? obj.open_problems : [],
    };
  } catch {
    return emptyReview();
  }
}

function emptyReview(): LiteratureReview {
  return { frontier_topics: [], competing_viewpoints: [], open_problems: [] };
}
