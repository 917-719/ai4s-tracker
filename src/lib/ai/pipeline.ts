import { v4 as uuid } from "uuid";
import { initDB, insertItems, setDailyRecommend, saveDailyReport, getTodayItems, getItemsInRange, savePeriodicReport, getStatsByDate } from "@/lib/db";
import { filterRelevance } from "./relevance-filter";
import { scoreAndSummarize } from "./score-item";
import { generateDailyReport } from "./daily-report";
import { generateLiteratureReview } from "./literature-review";
import type { Item } from "@/lib/db/schema";

interface IncomingItem {
  title: string;
  description: string;
  url: string;
  source_name: string;
  content_type_hint?: string; // 采集阶段猜测的类型，初筛会确认
  journal_or_venue?: string;
  published_at?: string;
  region_hint?: string;
}

/** ===== 每日数据采集 + AI 处理 完整管线 ===== */
export async function runDailyPipeline(fetchFn: () => Promise<IncomingItem[]>): Promise<{
  fetched: number;
  filtered: number;
  scored: number;
  saved: number;
  reportSummary: string;
}> {
  // 初始化数据库
  await initDB();

  // 1. 数据采集
  console.log("[Pipeline] Step 1: Fetching data...");
  const rawItems = await fetchFn();
  console.log(`[Pipeline] Fetched ${rawItems.length} raw items`);

  if (rawItems.length === 0) {
    return { fetched: 0, filtered: 0, scored: 0, saved: 0, reportSummary: "今日无新数据" };
  }

  // 2. 去重（基于 URL）
  const uniqueMap = new Map<string, IncomingItem>();
  for (const item of rawItems) {
    if (!uniqueMap.has(item.url)) {
      uniqueMap.set(item.url, item);
    }
  }
  const uniqueItems = Array.from(uniqueMap.values());
  console.log(`[Pipeline] After dedup: ${uniqueItems.length} unique`);

  // 3. 初筛 — 判断相关性
  console.log("[Pipeline] Step 2: Relevance filtering...");
  const candidates = uniqueItems.map((item, i) => ({
    index: i,
    title: item.title,
    description: item.description,
    source_name: item.source_name,
  }));
  const filterResults = await filterRelevance(candidates);
  const relevant = filterResults.filter((r) => r.relevant);
  console.log(`[Pipeline] Relevant: ${relevant.length} / ${uniqueItems.length}`);

  if (relevant.length === 0) {
    return {
      fetched: rawItems.length,
      filtered: 0,
      scored: 0,
      saved: 0,
      reportSummary: "今日采集内容经初筛后无 AI4S/AI4SS/AI4R 相关内容",
    };
  }

  // 4. 打分 + 摘要（对每一条通过的条目）
  console.log("[Pipeline] Step 3: Scoring & summarizing...");
  const scoredItems: Omit<Item, "created_at">[] = [];

  for (const r of relevant) {
    const src = uniqueItems[r.index];
    if (!src) continue;

    const scoreResult = await scoreAndSummarize({
      title: src.title,
      description: src.description,
      source_name: src.source_name,
      content_type: r.content_type as Item["content_type"],
      journal_or_venue: src.journal_or_venue || "",
    });

    if (!scoreResult) continue;

    // 阈值过滤
    const minScore = r.content_type === "paper" ? 5 : 4;
    if (scoreResult.score < minScore) continue;

    const now = new Date().toISOString();
    scoredItems.push({
      id: uuid(),
      title: src.title,
      description: src.description,
      url: src.url,
      source_name: src.source_name,
      content_type: r.content_type as Item["content_type"],
      category: r.category as Item["category"],
      subcategory: scoreResult.subcategory,
      authors_or_org: "",
      journal_or_venue: src.journal_or_venue || "",
      source_quality: scoreResult.source_quality,
      published_at: src.published_at || "",
      fetched_at: now,
      score: scoreResult.score,
      score_breakdown: JSON.stringify(scoreResult.score_breakdown),
      score_reason: scoreResult.score_reason,
      summary_cn: scoreResult.summary_cn,
      key_point: scoreResult.key_point,
      is_daily_recommended: 0,
      region: (r.region || src.region_hint || "global") as Item["region"],
    });
  }
  console.log(`[Pipeline] Scored & passed threshold: ${scoredItems.length}`);

  // 5. 入库
  console.log("[Pipeline] Step 4: Saving to DB...");
  const saved = await insertItems(scoredItems);
  console.log(`[Pipeline] Saved ${saved} items`);

  // 6. 日报生成
  console.log("[Pipeline] Step 5: Generating daily report...");
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayItems = await getTodayItems(todayStr);
  const report = await generateDailyReport(todayItems);

  // 设置推荐论文
  if (report.recommended_paper_id) {
    await setDailyRecommend(report.recommended_paper_id);
  }

  // 保存日报
  const stats = await getStatsByDate(todayStr);
  await saveDailyReport({
    id: uuid(),
    date: todayStr,
    summary: report.summary,
    stats: JSON.stringify(stats),
    recommended_paper_id: report.recommended_paper_id,
  });

  return {
    fetched: rawItems.length,
    filtered: relevant.length,
    scored: scoredItems.length,
    saved,
    reportSummary: report.summary,
  };
}

/** ===== 周报/月报生成管线 ===== */
export async function runPeriodicPipeline(
  type: "weekly" | "monthly"
): Promise<{ saved: boolean; summary: string }> {
  await initDB();

  const now = new Date();
  const days = type === "weekly" ? 7 : 30;
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);

  console.log(`[Pipeline] Generating ${type} report: ${startDate} → ${endDate}`);

  // 获取周期内全部条目
  const allItems = await getItemsInRange(startDate, endDate);
  const papers = allItems.filter((i) => i.content_type === "paper" && i.score >= 5);
  const topItems = allItems
    .sort((a, b) => b.score - a.score)
    .slice(0, type === "weekly" ? 10 : 15)
    .map((i) => ({ id: i.id, title: i.title, score: i.score, content_type: i.content_type }));

  // 生成趋势概述和文献综述
  const cnCount = allItems.filter((i) => i.region === "cn").length;
  const westernCount = allItems.filter((i) => i.region === "western").length;
  const trendSummary = `${type === "weekly" ? "本周" : "本月"}共收录 ${allItems.length} 条 AI4S/AI4SS/AI4R 相关内容（中国来源 ${cnCount} 条，西方来源 ${westernCount} 条），其中高评分论文 ${papers.length} 篇。`;

  const literatureReview = await generateLiteratureReview(papers, type);

  // 保存
  await savePeriodicReport({
    id: uuid(),
    period_start: startDate,
    period_end: endDate,
    report_type: type,
    top_items: JSON.stringify(topItems),
    trend_summary: trendSummary,
    literature_review: JSON.stringify(literatureReview),
  });

  console.log(`[Pipeline] ${type} report saved`);

  return {
    saved: true,
    summary: trendSummary,
  };
}
