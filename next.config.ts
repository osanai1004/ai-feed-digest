import type { NextConfig } from "next";

/** 全ページ共通のセキュリティヘッダー */
const SECURITY_HEADERS = [
  // MIME スニッフィング（Content-Type を無視した解釈）を禁止
  { key: "X-Content-Type-Options", value: "nosniff" },
  // iframe 埋め込みを禁止（クリックジャッキング対策）
  { key: "X-Frame-Options", value: "DENY" },
  // 外部サイトへ遷移する際にフル URL を送らない
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 使わないブラウザ機能を明示的に無効化
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ]);
  },
};

export default nextConfig;
