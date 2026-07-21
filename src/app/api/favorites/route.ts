import { NextResponse } from "next/server";
import { initDB, toggleFavorite, getFavorites } from "@/lib/db";

export const runtime = "nodejs";

/** POST: 切换收藏状态 */
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await initDB();
    const favorited = await toggleFavorite(id);

    return NextResponse.json({ favorited });
  } catch (err) {
    console.error("[favorites] POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** GET: 获取所有收藏 */
export async function GET() {
  try {
    await initDB();
    const items = await getFavorites();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[favorites] GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
