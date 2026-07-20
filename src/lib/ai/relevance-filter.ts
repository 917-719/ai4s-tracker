import { chatCompletion } from "./deepseek-client";
import { RELEVANCE_FILTER_SYSTEM } from "./prompts";

interface RelevanceResult {
  index: number;
  relevant: boolean;
  content_type: string;
  category: string;
  region: string;
  reason: string;
}

interface RawCandidate {
  index: number;
  title: string;
  description: string;
  source_name: string;
}

/** 批量初筛：判断内容是否与 AI4S/4SS/4R 相关 */
export async function filterRelevance(
  candidates: RawCandidate[],
  batchSize = 6
): Promise<RelevanceResult[]> {
  const results: RelevanceResult[] = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const userContent = batch
      .map(
        (c) =>
          `[${c.index}] 标题: ${c.title}\n摘要/描述: ${c.description.slice(0, 300)}\n来源: ${c.source_name}`
      )
      .join("\n\n---\n\n");

    const prompt = `${RELEVANCE_FILTER_SYSTEM}\n\n请逐一判断以下 ${batch.length} 条内容：\n\n${userContent}`;

    const raw = await chatCompletion(
      [
        { role: "system", content: RELEVANCE_FILTER_SYSTEM },
        { role: "user", content: prompt },
      ],
      { temperature: 0.1, max_tokens: batchSize * 200 }
    );

    // 从回复中提取每行的 JSON 对象
    const lines = raw.split("\n").filter((l) => l.trim().startsWith("{"));
    for (const line of lines) {
      try {
        const obj = JSON.parse(line.trim());
        results.push({
          index: obj.index ?? obj.编号,
          relevant: obj.relevant ?? obj.相关 ?? false,
          content_type: obj.content_type ?? obj.内容类型 ?? "paper",
          category: obj.category ?? obj.分类 ?? "AI4S",
          region: obj.region ?? obj.地域 ?? "global",
          reason: obj.reason ?? obj.理由 ?? "",
        });
      } catch {
        // 跳过解析失败的行
      }
    }
  }

  return results;
}
