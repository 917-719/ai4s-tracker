import { chatCompletion } from "./deepseek-client";
import { getScoreSystemPrompt } from "./prompts";
import type { Item } from "@/lib/db/schema";

export interface ScoreResult {
  subcategory: string;
  source_quality: Item["source_quality"];
  score: number;
  score_breakdown: Record<string, number>;
  score_reason: string;
  summary_cn: string;
  key_point: string;
}

interface ItemInput {
  title: string;
  description: string;
  source_name: string;
  content_type: Item["content_type"];
  journal_or_venue: string;
}

/** 对单条内容打分 + 生成中文摘要 */
export async function scoreAndSummarize(item: ItemInput): Promise<ScoreResult | null> {
  const systemPrompt = getScoreSystemPrompt(item.content_type);

  const userContent = `标题: ${item.title}
来源: ${item.source_name}
期刊/平台: ${item.journal_or_venue || "未提供"}
内容摘要: ${item.description.slice(0, 800)}`;

  try {
    const raw = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      { temperature: 0.2, max_tokens: 1500 }
    );

    // 尝试提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const obj = JSON.parse(jsonMatch[0]);

    // 校验必要字段
    if (obj.score === undefined || !obj.summary_cn) return null;

    return {
      subcategory: obj.subcategory || "",
      source_quality: validateSourceQuality(obj.source_quality),
      score: Math.min(10, Math.max(0, Number(obj.score))),
      score_breakdown: obj.score_breakdown || {},
      score_reason: obj.score_reason || "",
      summary_cn: obj.summary_cn,
      key_point: obj.key_point || "",
    };
  } catch {
    return null;
  }
}

function validateSourceQuality(s: string): Item["source_quality"] {
  const valid = ["top-tier", "authoritative", "general", "preprint"];
  return valid.includes(s) ? (s as Item["source_quality"]) : "general";
}
