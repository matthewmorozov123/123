create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete set null,
  name text not null,
  email text not null,
  business_type text not null,
  phone text,
  source text not null default 'chat_widget',
  last_message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  title text not null,
  url text not null,
  content text not null,
  chunk_index integer not null default 0,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
on public.documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create index if not exists chat_messages_session_idx
on public.chat_messages(session_id, created_at);

create index if not exists leads_email_idx
on public.leads(email);

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  url text,
  title text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.url,
    documents.title,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.leads enable row level security;
alter table public.documents enable row level security;

create policy "Service role manages chat sessions"
on public.chat_sessions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role manages chat messages"
on public.chat_messages
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role manages leads"
on public.leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role manages documents"
on public.documents
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
