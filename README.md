# Brightscale AI Customer Support Chat Widget

Production-ready Next.js 14 chat widget for Brightscale.us. It uses OpenAI streaming responses, Supabase chat history and lead capture, and pgvector retrieval so answers stay grounded in Brightscale content.

## Folder Structure

```txt
app/
  api/
    chat/route.ts       Streaming RAG chat endpoint
    embed/route.ts      Secured knowledge-base refresh endpoint
    leads/route.ts      Lead capture endpoint
  globals.css
  layout.tsx
  page.tsx              Demo page with widget mounted
components/
  chat/chat-widget.tsx  Floating Intercom-style chat UI
lib/
  config.ts
  leads.ts
  openai.ts
  prompts.ts
  rag.ts
  rate-limit.ts
  security.ts
  supabase.ts
  types.ts
  utils.ts
  validation.ts
scripts/
  ingest-brightscale.ts Brightscale crawler, chunker, embedder
supabase/
  schema.sql            Tables, pgvector index, match function, RLS
```

## Features

- Floating bottom-right chat widget with premium SaaS styling
- Dark and light mode support
- Mobile responsive layout
- Streaming AI responses over server-sent events
- Typing indicator, timestamps, auto-scroll, and starter prompts
- Brightscale-only RAG answers
- Lead-intent detection and lead capture form
- Supabase storage for sessions, messages, leads, and vector documents
- Secured `/api/embed` route for refreshing embeddings
- Input validation, origin checks, prompt-injection guardrails, and request rate limiting

## Environment

Create `.env.local` from `.env.example`.

```bash
OPENAI_API_KEY=sk-proj-your-key
OPENAI_CHAT_MODEL=gpt-4.1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

EMBED_API_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=https://brightscale.us,http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://brightscale.us
```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Confirm the `vector` extension is enabled.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it in browser code.

## Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build Knowledge Base

After environment variables and the Supabase schema are ready:

```bash
npm run ingest
```

The ingestion pipeline:

1. Starts from `https://brightscale.us`, `/products/voice`, `/products/social-media`, and related service URLs.
2. Crawls Brightscale product and service pages.
3. Removes non-content HTML.
4. Splits text into overlapping chunks.
5. Creates OpenAI embeddings.
6. Upserts chunks into `public.documents`.

You can also trigger ingestion through the secured API route:

```bash
curl -X POST https://your-domain.com/api/embed \
  -H "Authorization: Bearer $EMBED_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Chat Behavior

The system prompt requires the assistant to:

- Answer only from retrieved Brightscale context
- Say `I’m not fully sure about that yet. Please contact Brightscale directly.` when context is missing
- Stay concise, professional, and conversion-oriented
- Explain AI automation in simple business language
- Avoid hallucinating pricing, guarantees, or unsupported features
- Encourage the CTA: `Book a free consultation with Brightscale.`

Routing examples are included:

- Restaurants: SMS plus voice agents
- Med spas: voice plus lead follow-up
- Real estate: AI lead qualification
- Ecommerce: social media automation and messaging workflows

## API Routes

`POST /api/chat`

Streams assistant output. Body:

```json
{
  "sessionId": "uuid",
  "pageUrl": "https://brightscale.us/products/voice",
  "messages": [
    { "role": "user", "content": "Can Brightscale help my med spa?" }
  ]
}
```

`POST /api/leads`

Saves qualified leads. Body:

```json
{
  "sessionId": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "businessType": "Med spa",
  "phone": "555-123-4567",
  "source": "chat_widget"
}
```

`POST /api/embed`

Refreshes the knowledge base. Requires:

```txt
Authorization: Bearer EMBED_API_SECRET
```

## Vercel Deployment

1. Push the project to GitHub.
2. Create a Vercel project from the repo.
3. Add all environment variables from `.env.example`.
4. Deploy.
5. Run the ingestion job once after deploy:

```bash
curl -X POST https://your-vercel-domain.com/api/embed \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{}'
```

6. Add a Vercel Cron job or external scheduled job to call `/api/embed` when Brightscale site content changes.

## Embedding On Brightscale.us

The easiest deployment pattern is to host this Next.js app on Vercel and embed it on Brightscale pages as a small iframe or mount the `ChatWidget` component directly in the Brightscale Next.js site.

Direct component usage:

```tsx
import { ChatWidget } from "@/components/chat/chat-widget";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

## Future Integrations

The current code is structured so these can be added without rewriting the widget:

- GoHighLevel contact creation inside `app/api/leads/route.ts`
- Make.com webhook forwarding after Supabase lead insert
- Human handoff status on `chat_sessions`
- Voice AI from a separate capture component
- Appointment booking link or calendar API after lead qualification
- CRM sync worker that reads from `leads`

## Production Notes

- The included limiter is intentionally dependency-light. For heavy traffic, replace `lib/rate-limit.ts` with Upstash Redis, Vercel KV, or another shared store.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `EMBED_API_SECRET` out of client bundles.
- Keep `ALLOWED_ORIGINS` limited to Brightscale domains and local development.
- RAG quality depends on the ingested site copy. Re-run ingestion whenever product or service pages change.
