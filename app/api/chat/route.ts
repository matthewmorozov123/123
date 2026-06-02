import { NextResponse } from "next/server";
import { runtimeConfig, siteConfig } from "@/lib/config";
import { hasBuyingIntent, suggestedSolutionFor } from "@/lib/leads";
import { getOpenAI } from "@/lib/openai";
import { buildSystemPrompt } from "@/lib/prompts";
import { formatContext, retrieveBrightscaleContext } from "@/lib/rag";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { containsPromptInjection, assertAllowedOrigin } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { chatRequestSchema } from "@/lib/validation";

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

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function streamStaticAnswer(request: Request, answer: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse("token", { token: answer })));
      controller.enqueue(encoder.encode(sse("done", { answer, leadCapture: false, sources: [] })));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...corsHeaders(request)
    }
  });
}

async function persistMessages(
  sessionId: string,
  userMessage: string,
  assistantMessage: string
) {
  const supabase = getSupabaseAdmin();

  await supabase.from("chat_sessions").upsert({
    id: sessionId,
    updated_at: new Date().toISOString()
  });

  await supabase.from("chat_messages").insert([
    {
      session_id: sessionId,
      role: "user",
      content: userMessage
    },
    {
      session_id: sessionId,
      role: "assistant",
      content: assistantMessage
    }
  ]);
}

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request);

    const limited = rateLimit(`chat:${getClientIp(request)}`, 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const payload = chatRequestSchema.parse(await request.json());
    const latestUserMessage = [...payload.messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json({ error: "A user message is required." }, { status: 400 });
    }

    if (containsPromptInjection(latestUserMessage.content)) {
      return streamStaticAnswer(
        request,
        "I can help with Brightscale services, AI agents, automation, Meta ads, and lead generation. What would you like to improve in your business?"
      );
    }

    const retrievalQuery = payload.messages
      .filter((message) => message.role === "user")
      .slice(-4)
      .map((message) => message.content)
      .join("\n");
    const suggestedSolution = suggestedSolutionFor(retrievalQuery);
    const documents = await retrieveBrightscaleContext(retrievalQuery);
    const routingContext = suggestedSolution
      ? `Brightscale industry routing guidance: ${suggestedSolution}`
      : "";
    const context = [formatContext(documents), routingContext].filter(Boolean).join("\n\n---\n\n");
    const openai = getOpenAI();
    const buyingIntent = hasBuyingIntent(latestUserMessage.content);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAnswer = "";

        function send(event: string, data: unknown) {
          controller.enqueue(encoder.encode(sse(event, data)));
        }

        try {
          if (documents.length === 0 && !suggestedSolution) {
            fullAnswer = siteConfig.fallbackAnswer;
            send("token", { token: fullAnswer });
          } else {
            const completion = await openai.chat.completions.create({
              model: runtimeConfig.chatModel,
              stream: true,
              temperature: 0.25,
              messages: [
                {
                  role: "system",
                  content: buildSystemPrompt(context)
                },
                ...payload.messages.slice(-10).map((message) => ({
                  role: message.role,
                  content: message.content
                })),
                ...(suggestedSolution
                  ? [
                      {
                        role: "system" as const,
                        content: `If relevant, include this routing guidance: ${suggestedSolution}`
                      }
                    ]
                  : [])
              ]
            });

            for await (const part of completion) {
              const token = part.choices[0]?.delta?.content ?? "";
              if (!token) continue;
              fullAnswer += token;
              send("token", { token });
            }
          }

          if (buyingIntent && !fullAnswer.toLowerCase().includes("name")) {
            const leadAsk =
              "\n\nTo help Brightscale point you to the right solution, can you share your name, email, business type, and phone number if you’d like a call?";
            fullAnswer += leadAsk;
            send("token", { token: leadAsk });
          }

          await persistMessages(payload.sessionId, latestUserMessage.content, fullAnswer);

          send("done", {
            answer: fullAnswer,
            leadCapture: buyingIntent,
            sources: documents.map((doc) => ({
              title: doc.title,
              url: doc.url
            }))
          });
        } catch (error) {
          send("error", {
            error:
              error instanceof Error
                ? error.message
                : "The assistant could not complete the response."
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...corsHeaders(request)
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid chat request."
      },
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
