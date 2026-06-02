import { NextResponse } from "next/server";
import { ingestBrightscaleKnowledge } from "@/scripts/ingest-brightscale";
import { runtimeConfig } from "@/lib/config";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { embedRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = runtimeConfig.embedApiSecret ? `Bearer ${runtimeConfig.embedApiSecret}` : null;

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const limited = rateLimit(`embed:${getClientIp(request)}`, 2, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Embedding is rate limited." }, { status: 429 });
  }

  const payload = embedRequestSchema.parse(await request.json().catch(() => ({})));
  const result = await ingestBrightscaleKnowledge(payload.urls);

  return NextResponse.json(result);
}
