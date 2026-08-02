import { NextResponse } from "next/server";
import { storageMode } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const mode = storageMode();
  const vercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  return NextResponse.json({
    ok: !(vercel && mode === "local-json"),
    storage: mode,
    vercel,
    hint:
      vercel && mode === "local-json"
        ? "Connect Neon and set DATABASE_URL, then redeploy"
        : undefined,
  });
}
