import { runtimeConfig } from "@/lib/config";

const blockedPromptTerms = [
  "system prompt",
  "developer message",
  "ignore previous instructions",
  "reveal your instructions",
  "show hidden prompt",
  "jailbreak"
];

export function containsPromptInjection(text: string) {
  const normalized = text.toLowerCase();
  return blockedPromptTerms.some((term) => normalized.includes(term));
}

export function assertAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  if (!runtimeConfig.allowedOrigins.includes(origin)) {
    throw new Error("Origin is not allowed.");
  }
}
