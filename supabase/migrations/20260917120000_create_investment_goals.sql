-- Metas de inversión: igual que `goals` (ahorro) pero con un instrumento
-- (cripto, CDT, oro, acciones, etc.) para que el usuario defina en qué
-- va a invertir, no solo cuánto.
create table if not exists public.investment_goals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null default '',
  instrument text not null default 'otro'
    check (instrument in ('cripto', 'cdt', 'acciones', 'oro', 'fondos_indexados', 'bienes_raices', 'fondos_pension', 'otro')),
  target numeric not null check (target > 0),
  saved numeric not null default 0 check (saved >= 0),
  date date,
  created_at timestamptz not null default now()
);

alter table public.investment_goals enable row level security;

-- El dueño de la meta puede leer, crear, actualizar y borrar sus
-- propias metas de inversión (mismo esquema de acceso que `goals`).
create policy "investment_goals_select_own"
  on public.investment_goals for select
  using (auth.uid() = user_id);

create policy "investment_goals_insert_own"
  on public.investment_goals for insert
  with check (auth.uid() = user_id);

create policy "investment_goals_update_own"
  on public.investment_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "investment_goals_delete_own"
  on public.investment_goals for delete
  using (auth.uid() = user_id);

create index if not exists investment_goals_user_id_idx on public.investment_goals (user_id);
