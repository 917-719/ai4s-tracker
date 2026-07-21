"use client";

import { useState } from "react";

export function FavoriteButton({
  itemId,
  isFavorited,
}: {
  itemId: string;
  isFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      const data = await res.json();
      setFavorited(data.favorited);
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        favorited
          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
      }`}
      title={favorited ? "取消收藏" : "收藏"}
    >
      {favorited ? "⭐ 已收藏" : "☆ 收藏"}
    </button>
  );
}
