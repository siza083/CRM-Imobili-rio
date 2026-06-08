-- ============================================================
-- CRM Imobiliário — Schema do Banco de Dados
-- Executar no SQL Editor do Supabase
-- ============================================================

-- ─── Extensões ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Tabela: leads ───────────────────────────────────────────
create table if not exists public.leads (
  id               uuid primary key default uuid_generate_v4(),

  -- Dados do Meta
  meta_lead_id     text unique not null,
  meta_page_id     text,
  meta_form_id     text,
  meta_ad_id       text,
  meta_adset_id    text,

  -- Dados do lead
  nome             text,
  email            text,
  telefone         text,
  raw_fields       jsonb default '{}'::jsonb,

  -- CRM
  status           text not null default 'novo'
                   check (status in ('novo', 'em_contato', 'qualificado', 'descartado', 'convertido')),
  anotacoes        text,
  atribuido_a      uuid references auth.users(id) on delete set null,

  -- Timestamps
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

-- ─── Tabela: eventos_lead ─────────────────────────────────────
-- Histórico de interações com cada lead
create table if not exists public.eventos_lead (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  tipo        text not null, -- 'ligacao', 'whatsapp', 'email', 'visita', 'nota'
  descricao   text,
  criado_por  uuid references auth.users(id) on delete set null,
  criado_em   timestamptz not null default now()
);

-- ─── Função: atualizar atualizado_em automaticamente ─────────
create or replace function public.set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_atualizado_em
  before update on public.leads
  for each row execute function public.set_atualizado_em();

-- ─── Índices ─────────────────────────────────────────────────
create index if not exists idx_leads_status      on public.leads(status);
create index if not exists idx_leads_criado_em   on public.leads(criado_em desc);
create index if not exists idx_leads_meta_form   on public.leads(meta_form_id);
create index if not exists idx_eventos_lead_id   on public.eventos_lead(lead_id);

-- ─── Row Level Security (RLS) ────────────────────────────────
alter table public.leads          enable row level security;
alter table public.eventos_lead   enable row level security;

-- Usuários autenticados podem ler e escrever leads
create policy "Usuários autenticados podem ler leads"
  on public.leads for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir leads"
  on public.leads for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar leads"
  on public.leads for update
  to authenticated
  using (true);

-- Service role tem acesso total (para o webhook)
create policy "Service role tem acesso total a leads"
  on public.leads for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem ler eventos"
  on public.eventos_lead for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir eventos"
  on public.eventos_lead for insert
  to authenticated
  with check (true);

create policy "Service role tem acesso total a eventos"
  on public.eventos_lead for all
  to service_role
  using (true)
  with check (true);
