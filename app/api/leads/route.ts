import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { runtimeConfig } from "@/lib/config";
import { assertAllowedOrigin } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { leadSchema } from "@/lib/validation";

export const runtime = "nodejs";

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = runtimeConfig.allowedOrigins.includes(origin) ? origin : runtimeConfig.allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin"
  };
}

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request);

    const limited = rateLimit(`lead:${getClientIp(request)}`, 8, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many lead submissions. Please try again shortly." },
        { status: 429, headers: corsHeaders(request) }
      );
    }

    const lead = leadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("leads").insert({
      session_id: lead.sessionId,
      name: lead.name,
      email: lead.email,
      business_type: lead.businessType,
      phone: lead.phone || null,
      source: lead.source ?? "chat_widget",
      last_message: lead.lastMessage ?? null
    });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Thanks. Brightscale received your details and can follow up soon."
      },
      { headers: corsHeaders(request) }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lead submission failed." },
      { status: 400, headers: corsHeaders(request) }
    );
  }
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}
