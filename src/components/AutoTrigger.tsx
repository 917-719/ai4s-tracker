"use client";

import { useEffect, useRef } from "react";

/** 页面加载时自动触发 cron，点火就跑，不阻塞渲染 */
export function AutoTrigger() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // 点火就跑，不等待
    fetch("/api/cron/daily-fetch?secret=aB3xK9mW7qR2tY8n").catch(() => {});
  }, []);

  return null;
}
