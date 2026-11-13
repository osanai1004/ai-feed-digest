import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { classifyUserAgent } from "@/lib/botFilter";

/**
 * 画面と公開 API の手前で、名乗っている機械を断り、全アクセスを1行記録する。
 *
 * 記録（Vercel の Runtime Logs で見える）: 時刻はログ側に付く。
 *   [access] allow GET /?window=all ua="..."
 * これで「10〜20分おきに来る何か」の正体（どのページを・どの名前で）を突き止める。
 * IP アドレスは記録しない。
 */
export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent");
  const decision = classifyUserAgent(ua);
  const path = request.nextUrl.pathname + request.nextUrl.search;

  console.log(
    `[access] ${decision} ${request.method} ${path} ua=${JSON.stringify((ua ?? "").slice(0, 300))}`,
  );

  if (decision === "block") {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 次は対象外:
     * - _next/static, _next/image（画面の部品）
     * - robots.txt（断る相手にも「来ないで」を読ませるため）
     * - アイコン・OGP画像・public の画像（URL プレビュー用）
     * - /api/ingest, /api/intake（合言葉つきで GAS・浅子だけが使う）
     */
    "/((?!_next/static|_next/image|robots\\.txt|favicon\\.ico|icon\\.png|apple-icon\\.png|opengraph-image|twitter-image|brand/|api/ingest|api/intake|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt)$).*)",
  ],
};
