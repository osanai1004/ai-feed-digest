import { NextResponse } from "next/server";
import { getArticle, listArticles } from "@/lib/store";

export const runtime = "nodejs";

/**
 * ?id= があれば1件だけ返す（全件は読まない）。
 * id なしの全件は GAS の手動メンテ（repairExistingArticles / backfillDualVoiceArticles）用に残す。
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (id) {
    const article = await getArticle(id);
    return NextResponse.json({
      count: article ? 1 : 0,
      articles: article ? [article] : [],
    });
  }

  const articles = await listArticles();
  return NextResponse.json({
    count: articles.length,
    articles,
  });
}
