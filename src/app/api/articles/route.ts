import { NextResponse } from "next/server";
import { listArticles, storageMode } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json({
    storage: storageMode(),
    count: articles.length,
    articles,
  });
}
