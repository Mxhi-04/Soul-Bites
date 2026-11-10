begin;

create table public.kitchen_staff (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.kitchen_ordering (
  mode text primary key check (mode in ('test', 'live')),
  accepting_orders boolean not null default false,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null
);

insert into public.kitchen_ordering (mode) values ('test'), ('live');

create table public.kitchen_orders (
  id uuid primary key default gen_random_uuid(),
  request_key uuid not null unique,
  request_hash text not null,
  phone_hash text not null,
  mode text not null references public.kitchen_ordering(mode),
  status text not null check (status in (
    'unpaid', 'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery',
    'delivered', 'declined'
  )),
  payment_method text not null check (payment_method in ('cod', 'razorpay')),
  payment_state text not null check (payment_state in (
    'awaiting_payment', 'cash_due', 'cash_collected', 'paid', 'void',
    'refund_required', 'refund_pending', 'refunded', 'refund_failed'
  )),
  lines jsonb not null,
  amounts jsonb not null,
  delivery_details jsonb not null,
  events jsonb not null,
  created_at timestamptz not null default now(),
  revision integer not null default 0,
  prep_minutes integer,
  delivery_minutes integer,
  eta_at timestamptz,
  decline_reason text,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_refund_id text unique,
  gateway_started_at timestamptz,
  last_staff_user uuid references auth.users(id) on delete set null,
  check ((status = 'unpaid') = (payment_state = 'awaiting_payment')),
  check (prep_minutes is null or prep_minutes between 5 and 180),
  check (delivery_minutes is null or delivery_minutes between 5 and 180)
);

create index kitchen_orders_queue on public.kitchen_orders (mode, created_at desc, id desc);
create index kitchen_orders_phone_window on public.kitchen_orders (mode, phone_hash, created_at desc);

alter table public.kitchen_staff enable row level security;
alter table public.kitchen_ordering enable row level security;
alter table public.kitchen_orders enable row level security;
revoke all on public.kitchen_staff, public.kitchen_ordering, public.kitchen_orders from anon, authenticated;
grant select on public.kitchen_staff to service_role;
grant select, update on public.kitchen_ordering, public.kitchen_orders to service_role;

create function public.reserve_kitchen_order(
  p_request_key uuid, p_request_hash text, p_phone_hash text, p_mode text,
  p_payment_method text, p_lines jsonb, p_amounts jsonb, p_details jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  saved public.kitchen_orders;
  is_open boolean;
  initial_status text;
  initial_payment text;
  placed timestamptz := now();
begin
  -- Serialize the short admission transaction, including rate limit checks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('soul-bites:' || p_mode));

  select * into saved from public.kitchen_orders where request_key = p_request_key;
  if found then
    if saved.mode <> p_mode or saved.request_hash <> p_request_hash then
      raise exception 'request_conflict' using errcode = 'P0001';
    end if;
    return to_jsonb(saved);
  end if;

  select accepting_orders into is_open from public.kitchen_ordering
    where mode = p_mode for share;
  if is_open is distinct from true then
    raise exception 'kitchen_closed' using errcode = 'P0001';
  end if;

  if (select count(*) from public.kitchen_orders
      where mode = p_mode and phone_hash = p_phone_hash
        and created_at >= placed - interval '15 minutes') >= 4
    or (select count(*) from public.kitchen_orders
      where mode = p_mode and created_at >= placed - interval '1 minute') >= 40 then
    raise exception 'order_rate_limit' using errcode = 'P0001';
  end if;

  initial_status := case when p_payment_method = 'cod' then 'pending' else 'unpaid' end;
  initial_payment := case when p_payment_method = 'cod' then 'cash_due' else 'awaiting_payment' end;

  insert into public.kitchen_orders (
    request_key, request_hash, phone_hash, mode, status, payment_method, payment_state,
    lines, amounts, delivery_details, events, created_at
  ) values (
    p_request_key, p_request_hash, p_phone_hash, p_mode, initial_status,
    p_payment_method, initial_payment, p_lines, p_amounts, p_details,
    jsonb_build_array(jsonb_build_object('status', initial_status, 'at', placed)), placed
  ) returning * into saved;
  return to_jsonb(saved);
end;
$$;

revoke all on function public.reserve_kitchen_order(uuid, text, text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_kitchen_order(uuid, text, text, text, text, jsonb, jsonb, jsonb) to service_role;

commit;
