-- findbus schema. Every object is prefixed fb_ so it can live alongside
-- other apps in a shared Supabase project.
--
-- Access model: tables have RLS on and no policies, so the anon key cannot
-- read or write them directly. All access goes through the security definer
-- functions below, which check the owner or driver secret where needed.

create extension if not exists pgcrypto;

create table if not exists fb_waitlist (
  id bigint generated always as identity primary key,
  role text not null check (role in ('rider', 'owner')),
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 200),
  city text check (char_length(city) <= 120),
  bus_count int check (bus_count between 0 and 10000),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create table if not exists fb_owners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  company text check (char_length(company) <= 120),
  phone text not null check (char_length(phone) between 5 and 30),
  email text check (char_length(email) <= 200),
  city text check (char_length(city) <= 120),
  secret uuid not null unique default gen_random_uuid(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists fb_buses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references fb_owners(id) on delete cascade,
  reg_no text not null check (char_length(reg_no) between 2 and 20),
  name text check (char_length(name) <= 80),
  route_name text not null check (char_length(route_name) between 1 and 120),
  stops text[] not null default '{}' check (cardinality(stops) <= 60),
  driver_secret uuid not null unique default gen_random_uuid(),
  active boolean not null default true,
  is_demo boolean not null default false,
  -- Demo buses move back and forth on a straight line between these points.
  demo_from_lat double precision,
  demo_from_lng double precision,
  demo_to_lat double precision,
  demo_to_lng double precision,
  created_at timestamptz not null default now()
);

create index if not exists fb_buses_owner_idx on fb_buses (owner_id);

create table if not exists fb_locations (
  bus_id uuid primary key references fb_buses(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  speed double precision,
  heading double precision,
  updated_at timestamptz not null default now()
);

alter table fb_waitlist enable row level security;
alter table fb_owners enable row level security;
alter table fb_buses enable row level security;
alter table fb_locations enable row level security;

revoke all on fb_waitlist, fb_owners, fb_buses, fb_locations from anon, authenticated;

-- Small helper: trim and turn empty strings into null.
create or replace function fb_clean(v text)
returns text language sql immutable set search_path = public as $$
  select nullif(btrim(v), '')
$$;

-- Waitlist ---------------------------------------------------------------

create or replace function fb_join_waitlist(
  p_role text, p_name text, p_phone text default null, p_email text default null,
  p_city text default null, p_bus_count int default null, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into fb_waitlist (role, name, phone, email, city, bus_count, note)
  values (p_role, fb_clean(p_name), fb_clean(p_phone), lower(fb_clean(p_email)),
          fb_clean(p_city), p_bus_count, fb_clean(p_note));
end $$;

-- Owners -----------------------------------------------------------------

create or replace function fb_register_owner(
  p_name text, p_phone text, p_company text default null,
  p_email text default null, p_city text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_secret uuid;
begin
  insert into fb_owners (name, phone, company, email, city)
  values (fb_clean(p_name), fb_clean(p_phone), fb_clean(p_company),
          lower(fb_clean(p_email)), fb_clean(p_city))
  returning secret into v_secret;
  return v_secret;
end $$;

create or replace function fb_owner_dashboard(p_secret uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare v_owner fb_owners;
begin
  select * into v_owner from fb_owners where secret = p_secret;
  if not found then
    raise exception 'Owner not found' using errcode = 'P0002';
  end if;
  return json_build_object(
    'owner', json_build_object('name', v_owner.name, 'company', v_owner.company,
                               'phone', v_owner.phone, 'email', v_owner.email,
                               'city', v_owner.city),
    'buses', coalesce((
      select json_agg(json_build_object(
        'id', b.id, 'reg_no', b.reg_no, 'name', b.name, 'route_name', b.route_name,
        'stops', b.stops, 'active', b.active, 'driver_secret', b.driver_secret,
        'lat', l.lat, 'lng', l.lng, 'location_updated_at', l.updated_at
      ) order by b.created_at)
      from fb_buses b left join fb_locations l on l.bus_id = b.id
      where b.owner_id = v_owner.id
    ), '[]'::json)
  );
end $$;

create or replace function fb_add_bus(
  p_secret uuid, p_reg_no text, p_route_name text,
  p_stops text[] default '{}', p_name text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_owner_id uuid; v_id uuid;
begin
  select id into v_owner_id from fb_owners where secret = p_secret;
  if v_owner_id is null then
    raise exception 'Owner not found' using errcode = 'P0002';
  end if;
  if (select count(*) from fb_buses where owner_id = v_owner_id) >= 200 then
    raise exception 'Bus limit reached';
  end if;
  insert into fb_buses (owner_id, reg_no, name, route_name, stops)
  values (
    v_owner_id, upper(fb_clean(p_reg_no)), fb_clean(p_name), fb_clean(p_route_name),
    coalesce((select array_agg(s) from (
      select fb_clean(x) s from unnest(p_stops) with ordinality u(x, n) order by n
    ) t where s is not null), '{}')
  )
  returning id into v_id;
  return v_id;
end $$;

create or replace function fb_set_bus_active(p_secret uuid, p_bus_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update fb_buses b set active = p_active
  from fb_owners o
  where b.id = p_bus_id and b.owner_id = o.id and o.secret = p_secret;
end $$;

create or replace function fb_delete_bus(p_secret uuid, p_bus_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from fb_buses b
  using fb_owners o
  where b.id = p_bus_id and b.owner_id = o.id and o.secret = p_secret;
end $$;

-- Drivers ----------------------------------------------------------------

create or replace function fb_driver_bus(p_driver_secret uuid)
returns json
language sql security definer set search_path = public as $$
  select json_build_object('reg_no', reg_no, 'name', name, 'route_name', route_name,
                           'stops', stops, 'active', active)
  from fb_buses where driver_secret = p_driver_secret
$$;

create or replace function fb_update_location(
  p_driver_secret uuid, p_lat double precision, p_lng double precision,
  p_speed double precision default null, p_heading double precision default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_bus_id uuid;
begin
  select id into v_bus_id from fb_buses where driver_secret = p_driver_secret and active;
  if v_bus_id is null then
    raise exception 'Bus not found or inactive' using errcode = 'P0002';
  end if;
  insert into fb_locations (bus_id, lat, lng, speed, heading, updated_at)
  values (v_bus_id, p_lat, p_lng, p_speed, p_heading, now())
  on conflict (bus_id) do update
    set lat = excluded.lat, lng = excluded.lng, speed = excluded.speed,
        heading = excluded.heading, updated_at = excluded.updated_at;
end $$;

-- Riders -----------------------------------------------------------------

-- Search active buses. p_q matches registration, name, route or any stop.
-- p_from / p_to must both appear among the bus's stops (either direction).
create or replace function fb_search(
  p_q text default '', p_from text default '', p_to text default ''
) returns table (
  id uuid, reg_no text, name text, route_name text, stops text[],
  operator text, is_demo boolean,
  lat double precision, lng double precision, speed double precision,
  heading double precision, location_updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with params as (
    select '%' || coalesce(fb_clean(p_q), '') || '%' as q,
           '%' || fb_clean(p_from) || '%' as f,
           '%' || fb_clean(p_to) || '%' as t,
           -- 0..1..0 every 30 minutes, so demo buses drive out and back.
           1 - abs(1 - 2 * ((extract(epoch from now()) / 1800.0) - floor(extract(epoch from now()) / 1800.0))) as phase
  )
  select b.id, b.reg_no, b.name, b.route_name, b.stops,
         coalesce(o.company, o.name), b.is_demo,
         case when b.is_demo then b.demo_from_lat + (b.demo_to_lat - b.demo_from_lat) * p.phase else l.lat end,
         case when b.is_demo then b.demo_from_lng + (b.demo_to_lng - b.demo_from_lng) * p.phase else l.lng end,
         case when b.is_demo then 32 else l.speed end,
         l.heading,
         case when b.is_demo then now() else l.updated_at end
  from fb_buses b
  join fb_owners o on o.id = b.owner_id
  left join fb_locations l on l.bus_id = b.id
  cross join params p
  where b.active
    and (b.reg_no ilike p.q or b.name ilike p.q or b.route_name ilike p.q
         or exists (select 1 from unnest(b.stops) s where s ilike p.q)
         or coalesce(o.company, o.name) ilike p.q)
    and (p.f is null or exists (select 1 from unnest(b.stops) s where s ilike p.f))
    and (p.t is null or exists (select 1 from unnest(b.stops) s where s ilike p.t))
  order by (l.updated_at is null and not b.is_demo), b.route_name, b.reg_no
  limit 200
$$;

revoke all on function
  fb_clean(text),
  fb_join_waitlist(text, text, text, text, text, int, text),
  fb_register_owner(text, text, text, text, text),
  fb_owner_dashboard(uuid),
  fb_add_bus(uuid, text, text, text[], text),
  fb_set_bus_active(uuid, uuid, boolean),
  fb_delete_bus(uuid, uuid),
  fb_driver_bus(uuid),
  fb_update_location(uuid, double precision, double precision, double precision, double precision),
  fb_search(text, text, text)
from public;

revoke all on function fb_clean(text) from anon, authenticated;

grant execute on function
  fb_join_waitlist(text, text, text, text, text, int, text),
  fb_register_owner(text, text, text, text, text),
  fb_owner_dashboard(uuid),
  fb_add_bus(uuid, text, text, text[], text),
  fb_set_bus_active(uuid, uuid, boolean),
  fb_delete_bus(uuid, uuid),
  fb_driver_bus(uuid),
  fb_update_location(uuid, double precision, double precision, double precision, double precision),
  fb_search(text, text, text)
to anon, authenticated;
