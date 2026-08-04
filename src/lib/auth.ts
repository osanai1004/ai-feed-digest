import { createHash, timingSafeEqual } from "crypto";

/**
 * 長さの異なる文字列でも比較時間が一定になるよう、
 * ハッシュ化してから timingSafeEqual（タイミング攻撃対策の定数時間比較）で照合する。
 */
function secureCompare(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

export function assertIngestAuthorized(request: Request) {
  const secret = process.env.INGEST_SECRET?.trim();
  if (!secret) {
    const error = new Error("Service is not configured");
    (error as Error & { status: number }).status = 503;
    throw error;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !secureCompare(token, secret)) {
    const error = new Error("Unauthorized");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
}
