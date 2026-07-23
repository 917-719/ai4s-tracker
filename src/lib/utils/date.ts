/** 获取北京时间昨天日期（YYYY-MM-DD），用于 fetched_at 和页面查询 */
export function beijingYesterday(): string {
  const now = new Date();
  // 转为北京时间（UTC+8），再减一天
  const beijing = new Date(now.getTime() + 8 * 3600000 - 86400000);
  return beijing.toISOString().slice(0, 10);
}

/** 同上，返回 Date 对象 */
export function beijingYesterdayDate(): Date {
  return new Date(Date.now() + 8 * 3600000 - 86400000);
}
