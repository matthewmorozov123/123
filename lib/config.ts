export const siteConfig = {
  companyName: "Brightscale",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://brightscale.us",
  fallbackAnswer:
    "I’m not fully sure about that yet. Please contact Brightscale directly.",
  consultationCta: "Book a free consultation with Brightscale.",
  specialties: [
    "AI automation",
    "AI voice agents",
    "AI messaging agents",
    "Meta ads",
    "lead generation"
  ]
};

export const runtimeConfig = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  embedApiSecret: process.env.EMBED_API_SECRET,
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "https://brightscale.us")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
