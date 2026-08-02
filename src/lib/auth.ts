export function assertIngestAuthorized(request: Request) {
  const secret = process.env.INGEST_SECRET?.trim();
  if (!secret) {
    throw new Error("INGEST_SECRET is not set");
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token !== secret) {
    const error = new Error("Unauthorized");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
}
