import { chatCompletion } from "./deepseek-client";
import { RELEVANCE_FILTER_SYSTEM } from "./prompts";

interface RelevanceResult {
  index: number;
  relevant: boolean;
  content_type: string;
  category: string;
  region: string;
  ai_role: string;
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
          content_type: normalizeContentType(obj.content_type ?? obj.内容类型),
          category: normalizeCategory(obj.category ?? obj.分类),
          region: normalizeRegion(obj.region ?? obj.地域),
          ai_role: (obj.ai_role === "tool-application" ? "tool-application" : "core-method"),
          reason: obj.reason ?? obj.理由 ?? "",
        });
      } catch {
        // 跳过解析失败的行
      }
    }
  }

  return results;
}

/** 强制映射到 DB CHECK 约束允许的值 */
function normalizeContentType(v: string) {
  const map: Record<string, string> = { paper: "paper", "论文": "paper", "model-product": "model-product", "模型/产品": "model-product", "模型": "model-product", "institutional-news": "institutional-news", "机构/政策": "institutional-news", "机构": "institutional-news", "investment-news": "investment-news", "产业/投资": "investment-news", "投资": "investment-news" };
  return map[v] || "paper";
}
function normalizeCategory(v: string) {
  const valid = ["AI4S", "AI4SS", "AI4R"];
  return valid.includes(v) ? v : "AI4S";
}
function normalizeRegion(v: string) {
  const map: Record<string, string> = { cn: "cn", "中国": "cn", western: "western", "欧美": "western", global: "global", "全球": "global" };
  return map[v] || "global";
}
