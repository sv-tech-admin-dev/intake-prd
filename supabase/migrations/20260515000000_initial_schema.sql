-- Initial Supabase migration for the intake PRD app.
-- Apply with the Supabase CLI using `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.intake_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  submission_id uuid,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  schema_version text not null,
  client_name text not null default '',
  project_name text not null default '',
  contact_email text not null default '',
  website_type text not null default 'new_website',
  status text not null default 'draft',
  readiness_score integer not null default 0,
  owner text not null default '',
  notes text[] not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.intake_submissions(id) on delete cascade,
  question_id text not null,
  answer_value jsonb not null,
  is_visible_at_submission boolean not null default true,
  hidden_answer_policy text not null default 'retain_when_hidden',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create table if not exists public.intake_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.intake_submissions(id) on delete cascade,
  storage_key text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.intake_submissions(id) on delete cascade,
  document_type text not null,
  status text not null default 'queued',
  markdown_content text not null default '',
  markdown_storage_key text,
  pdf_storage_key text,
  model_name text,
  estimated_cost_usd numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.intake_submissions(id) on delete cascade,
  generated_document_id uuid references public.generated_documents(id) on delete set null,
  channel text not null,
  event_type text not null,
  status text not null default 'queued',
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists intake_submissions_status_idx on public.intake_submissions(status);
create index if not exists intake_answers_submission_idx on public.intake_answers(submission_id);
create index if not exists generated_documents_submission_idx on public.generated_documents(submission_id);
create index if not exists notification_logs_submission_idx on public.notification_logs(submission_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

alter table public.intake_submissions enable row level security;
alter table public.intake_answers enable row level security;
alter table public.intake_files enable row level security;
alter table public.generated_documents enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;

-- TODO: replace these with project-specific policies.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'intake_submissions' and policyname = 'authenticated users can read submissions'
  ) then
    create policy "authenticated users can read submissions"
      on public.intake_submissions
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'intake_answers' and policyname = 'authenticated users can read answers'
  ) then
    create policy "authenticated users can read answers"
      on public.intake_answers
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'generated_documents' and policyname = 'authenticated users can read documents'
  ) then
    create policy "authenticated users can read documents"
      on public.generated_documents
      for select
      to authenticated
      using (true);
  end if;
end $$;
