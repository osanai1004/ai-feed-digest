import { NextResponse } from "next/server";
import { listArticles } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json({
    count: articles.length,
    articles,
  });
}
