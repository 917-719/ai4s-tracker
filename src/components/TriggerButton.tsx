"use client";

import { useState } from "react";

export function TriggerButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      await fetch("/api/cron/daily-fetch?secret=aB3xK9mW7qR2tY8n");
    } catch {
      // 即使请求失败也继续（后端可能已经在跑）
    }
    setStatus("done");
    // 开始每 20 秒刷新，直到数据出现
    setTimeout(() => {
      location.reload();
    }, 20000);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={status !== "idle"}
        className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
          status === "idle"
            ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
            : status === "loading"
              ? "bg-blue-400 cursor-wait"
              : "bg-emerald-600"
        }`}
      >
        {status === "idle" && "🚀 开始采集昨日数据"}
        {status === "loading" && "⏳ 触发中..."}
        {status === "done" && "✅ 已触发，页面每20秒自动刷新"}
      </button>
    </div>
  );
}
