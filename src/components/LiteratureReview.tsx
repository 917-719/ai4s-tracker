"use client";

import React, { useState } from "react";
import type { LiteratureReview as LRType } from "@/lib/db/schema";

export function LiteratureReview({ review }: { review: LRType }) {
  const [openPanel, setOpenPanel] = useState<"topics" | "viewpoints" | "problems" | null>("topics");

  const panels = [
    {
      key: "topics" as const,
      label: "前沿话题",
      icon: "🔬",
      items: review.frontier_topics,
      empty: "本期暂无识别到突出前沿话题",
      render: (item: LRType["frontier_topics"][0]) => (
        <div key={item.topic} className="mb-4 last:mb-0">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">{item.topic}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{item.summary}</p>
          {item.key_papers.length > 0 ? (
            <p className="text-xs text-slate-400">
              📄 代表：{item.key_papers.slice(0, 3).join("、")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "viewpoints" as const,
      label: "观点争锋",
      icon: "⚔️",
      items: review.competing_viewpoints,
      empty: "本期暂无识别到明显的方法或理论争锋",
      render: (item: LRType["competing_viewpoints"][0]) => (
        <div key={item.issue} className="mb-4 last:mb-0">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">争议：{item.issue}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-2">
              <span className="font-semibold text-red-700 dark:text-red-400">立场A：</span>
              <span className="text-slate-600 dark:text-slate-400">{item.position_a}</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2">
              <span className="font-semibold text-blue-700 dark:text-blue-400">立场B：</span>
              <span className="text-slate-600 dark:text-slate-400">{item.position_b}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "problems" as const,
      label: "待解问题",
      icon: "❓",
      items: review.open_problems,
      empty: "本期暂无识别到突出待解决问题",
      render: (item: LRType["open_problems"][0]) => (
        <div key={item.problem} className="mb-4 last:mb-0">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">❓ {item.problem}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">难点：{item.why_hard}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">近期尝试：{item.recent_attempts}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
        📚 文献综述
      </h3>
      <div className="space-y-2">
        {panels.map((panel) => (
          <div key={panel.key} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenPanel(openPanel === panel.key ? null : panel.key)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span>{panel.icon}</span>
              <span>{panel.label}</span>
              <span className="text-xs text-slate-400 ml-1">({panel.items.length})</span>
              <span className="ml-auto text-slate-400 text-xs">{openPanel === panel.key ? "▲" : "▼"}</span>
            </button>
            {openPanel === panel.key ? (
              <div className="px-4 pb-4">
                {panel.items.length > 0 ? (
                  (panel.items as Array<Record<string, unknown>>).map(
                    panel.render as (item: Record<string, unknown>) => React.ReactNode
                  )
                ) : (
                  <p className="text-sm text-slate-400 italic">{panel.empty}</p>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
