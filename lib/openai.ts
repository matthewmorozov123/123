import OpenAI from "openai";
import { runtimeConfig } from "@/lib/config";

export function getOpenAI() {
  if (!runtimeConfig.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  return new OpenAI({
    apiKey: runtimeConfig.openAiApiKey
  });
}
