import { chatCompletion } from "./deepseek-client";
import { DAILY_REPORT_SYSTEM } from "./prompts";
import type { Item } from "@/lib/db/schema";

export interface DailyReportResult {
  summary: string;
  recommended_paper_id: string | null;
  highlights: string[];
}

/** 基于当日全部入库条目生成日报 */
export async function generateDailyReport(items: Item[]): Promise<DailyReportResult> {
  if (items.length === 0) {
    return {
      summary: "今日暂无符合条件的 AI4S/AI4SS/AI4R 相关内容入库。",
      recommended_paper_id: null,
      highlights: [],
    };
  }

  // 构建精简的输入（避免 token 过多）
  const itemsForPrompt = items.map((item) => ({
    id: item.id,
    title: item.title,
    content_type: item.content_type,
    category: item.category,
    region: item.region,
    score: item.score,
    key_point: item.key_point,
    source_name: item.source_name,
  }));

  const userContent = `今日入库条目（共${items.length}条）：\n${JSON.stringify(itemsForPrompt, null, 2)}`;

  try {
    const raw = await chatCompletion(
      [
        { role: "system", content: DAILY_REPORT_SYSTEM },
        { role: "user", content: userContent },
      ],
      { temperature: 0.3, max_tokens: 1500 }
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackReport(items);
    }

    const obj = JSON.parse(jsonMatch[0]);
    return {
      summary: obj.summary || "日报生成中...",
      recommended_paper_id: obj.recommended_paper_id || null,
      highlights: Array.isArray(obj.highlights) ? obj.highlights : [],
    };
  } catch {
    return fallbackReport(items);
  }
}

function fallbackReport(items: Item[]): DailyReportResult {
  const papers = items.filter((i) => i.content_type === "paper").sort((a, b) => b.score - a.score);
  const bestPaper = papers[0];
  return {
    summary: `今日共收录 ${items.length} 条 AI4S/AI4SS/AI4R 相关内容，其中论文 ${papers.length} 篇，模型/产品 ${items.filter((i) => i.content_type === "model-product").length} 项，机构动态 ${items.filter((i) => i.content_type === "institutional-news").length} 条，产业投资 ${items.filter((i) => i.content_type === "investment-news").length} 条。`,
    recommended_paper_id: bestPaper?.id || null,
    highlights: bestPaper ? [bestPaper.key_point] : [],
  };
}
