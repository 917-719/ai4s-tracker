"use client";

import { useEffect, useRef } from "react";

/** 页面加载时自动触发 cron，无 secret，后端做防重复保护 */
export function AutoTrigger() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch("/api/cron/daily-fetch").catch(() => {});
  }, []);

  return null;
}
