import { runtimeConfig } from "@/lib/config";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { RetrievedDocument } from "@/lib/types";

export async function createEmbedding(input: string) {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: runtimeConfig.embeddingModel,
    input
  });

  return response.data[0].embedding;
}

export async function retrieveBrightscaleContext(query: string) {
  const supabase = getSupabaseAdmin();
  const embedding = await createEmbedding(query);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 6,
    match_threshold: 0.25
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as RetrievedDocument[];
}

export function formatContext(documents: RetrievedDocument[]) {
  return documents
    .map((doc, index) => {
      return [
        `Source ${index + 1}: ${doc.title}`,
        `URL: ${doc.url}`,
        doc.content
      ].join("\n");
    })
    .join("\n\n---\n\n");
}
