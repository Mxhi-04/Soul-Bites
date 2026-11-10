begin;

create table public.kitchen_delivery_lookups (
  mode text not null references public.kitchen_ordering(mode),
  phone_hash text not null,
  checked_at timestamptz not null default now()
);

create index kitchen_delivery_lookups_window
  on public.kitchen_delivery_lookups (mode, checked_at desc);

alter table public.kitchen_delivery_lookups enable row level security;
revoke all on public.kitchen_delivery_lookups from public, anon, authenticated, service_role;

create function public.authorize_delivery_lookup(p_mode text, p_phone_hash text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  is_open boolean;
  checked timestamptz := now();
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('soul-bites-delivery:' || p_mode));
  select accepting_orders into is_open from public.kitchen_ordering where mode = p_mode for share;
  if is_open is distinct from true then
    raise exception 'kitchen_closed' using errcode = 'P0001';
  end if;

  delete from public.kitchen_delivery_lookups
    where mode = p_mode and checked_at < checked - interval '15 minutes';
  if (select count(*) from public.kitchen_delivery_lookups
      where mode = p_mode and phone_hash = p_phone_hash) >= 6
    or (select count(*) from public.kitchen_delivery_lookups
      where mode = p_mode and checked_at >= checked - interval '1 minute') >= 40 then
    raise exception 'delivery_lookup_limit' using errcode = 'P0001';
  end if;

  insert into public.kitchen_delivery_lookups (mode, phone_hash, checked_at)
    values (p_mode, p_phone_hash, checked);
end;
$$;

revoke all on function public.authorize_delivery_lookup(text, text) from public, anon, authenticated;
grant execute on function public.authorize_delivery_lookup(text, text) to service_role;

commit;
