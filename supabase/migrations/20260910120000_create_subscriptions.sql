-- Tabla de suscripciones/planes. Reemplaza a user_metadata.plan, que
-- cualquier usuario autenticado podía editar directamente desde la
-- consola del navegador vía la API pública de Supabase Auth
-- (auto-otorgarse plan premium gratis).
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'gratis'
    check (plan in ('gratis', 'premium_mensual', 'premium_anual')),
  plan_started_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- El usuario solo puede LEER su propia fila. A propósito no hay
-- política de INSERT/UPDATE/DELETE para authenticated/anon: la única
-- forma de escribir es vía service role (Edge Function set-plan),
-- porque el service role ignora RLS.
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Fila en plan gratis para cada usuario nuevo que se registre.
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan)
  values (new.id, 'gratis')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

-- Backfill: usuarios que ya existían tenían el plan en user_metadata.
insert into public.subscriptions (user_id, plan, plan_started_at)
select
  id,
  coalesce(raw_user_meta_data ->> 'plan', 'gratis'),
  nullif(raw_user_meta_data ->> 'plan_started_at', '')::timestamptz
from auth.users
on conflict (user_id) do nothing;
