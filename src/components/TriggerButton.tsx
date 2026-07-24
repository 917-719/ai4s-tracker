"use client";

import { useState } from "react";

export function TriggerButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleClick() {
    setStatus("loading");
    // 点火就跑，不等待返回（pipeline 要跑 2-3 分钟）
    fetch("/api/cron/daily-fetch").catch(() => {});
    setStatus("done");
    // 每 30 秒刷新一次，直到数据出现
    setTimeout(() => location.reload(), 30000);
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
        {status === "done" && "✅ 已触发，30秒后自动刷新"}
      </button>
    </div>
  );
}
