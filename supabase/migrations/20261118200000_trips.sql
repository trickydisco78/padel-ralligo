-- Trips: several per member, private to their owner, shared with other members only on purpose.
-- profile_trips (the old single trip) is copied in as hidden trips and then left untouched and unused;
-- dropping it needs the owner's approval and is a separate migration.
-- Overlap is answered by two functions for signed-in callers only. Anonymous callers cannot run them.

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id),
  start_date date not null,
  end_date date not null,
  visibility text not null default 'hidden' check (visibility in ('hidden', 'members')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index trips_profile_idx on public.trips (profile_id, start_date);
create index trips_shared_overlap_idx
  on public.trips (destination_id, start_date, end_date)
  where visibility = 'members';

-- At most 10 trips per member.
create function public.enforce_trip_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.trips where profile_id = new.profile_id) >= 10 then
    raise exception 'You can save up to 10 trips';
  end if;
  return new;
end;
$$;

create trigger trips_enforce_limit
  before insert on public.trips
  for each row execute function public.enforce_trip_limit();

alter table public.trips enable row level security;

create policy "users read their own trips"
  on public.trips for select to authenticated using (profile_id = auth.uid());
create policy "users add their own trips"
  on public.trips for insert to authenticated with check (profile_id = auth.uid());
create policy "users update their own trips"
  on public.trips for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "users delete their own trips"
  on public.trips for delete to authenticated using (profile_id = auth.uid());

revoke all on public.trips from anon;
grant select, insert, update, delete on public.trips to authenticated;

-- Existing single trips become hidden trips.
insert into public.trips (profile_id, destination_id, start_date, end_date)
select profile_id, destination_id, start_date, end_date from public.profile_trips;

-- ---------------------------------------------------------------------------
-- my_trips_overview: the caller's upcoming trips with length and overlap count
--   * p_today comes from the device but is clamped to within a day of the server's date
--   * a player counts when they are listed (discoverable_at set, padel tier), the trip is shared
--     (visibility = 'members'), the destination is the same and the dates overlap
-- ---------------------------------------------------------------------------
create function public.my_trips_overview(p_today date default current_date)
returns table (
  trip_id uuid,
  destination_id uuid,
  destination_name text,
  destination_country text,
  start_date date,
  end_date date,
  visibility text,
  days integer,
  overlap_players integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select greatest(current_date - 1, least(current_date + 1, coalesce(p_today, current_date))) as today_date
  )
  select
    t.id as trip_id,
    t.destination_id,
    d.name as destination_name,
    d.country as destination_country,
    t.start_date,
    t.end_date,
    t.visibility,
    (t.end_date - t.start_date + 1)::integer as days,
    (
      select count(distinct o.profile_id)::integer
      from public.trips o
      join public.profiles p on p.id = o.profile_id and p.discoverable_at is not null
      join public.profile_sports ps on ps.profile_id = o.profile_id and ps.sport = 'padel'
      where o.visibility = 'members'
        and o.profile_id <> auth.uid()
        and o.destination_id = t.destination_id
        and o.start_date <= t.end_date
        and o.end_date >= t.start_date
        and o.end_date >= (select b.today_date from bounds b)
    ) as overlap_players
  from public.trips t
  join public.destinations d on d.id = t.destination_id
  where auth.uid() is not null
    and t.profile_id = auth.uid()
    and t.end_date >= (select b.today_date from bounds b)
  order by t.start_date, t.id;
$$;

revoke all on function public.my_trips_overview(date) from public, anon, authenticated;
grant execute on function public.my_trips_overview(date) to authenticated;

-- ---------------------------------------------------------------------------
-- find_overlapping_players: players who overlap one of the caller's trips
--   * nothing is returned unless p_trip_id is a trip of auth.uid(), so a supplied id proves nothing
--   * inclusive days: overlap_days = least(end dates) - greatest(start dates) + 1
--   * one row per player: their trip with the most overlapping days
--   * p_this_week: the overlap includes a day from Monday to Sunday of the week of p_today
--   * p_my_level: the caller's own tier or the one next to it (read here, never supplied)
--   * p_query matches the displayed name with strpos (no wildcards), capped at 40 characters
--   * at most 50 rows per call and nothing from offset 100, as in search_players
-- ---------------------------------------------------------------------------
create function public.find_overlapping_players(
  p_trip_id uuid,
  p_my_level boolean default false,
  p_this_week boolean default false,
  p_query text default null,
  p_today date default current_date,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  player_id uuid,
  display_name text,
  destination_id uuid,
  destination_name text,
  skill_tier text,
  trip_start date,
  trip_end date,
  overlap_days integer,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select greatest(current_date - 1, least(current_date + 1, coalesce(p_today, current_date))) as today_date
  ), this_week as (
    select
      date_trunc('week', b.today_date)::date as week_start,
      date_trunc('week', b.today_date)::date + 6 as week_end
    from bounds b
  ), mine as (
    select t.destination_id, t.start_date, t.end_date
    from public.trips t
    cross join bounds b
    where auth.uid() is not null
      and t.id = p_trip_id
      and t.profile_id = auth.uid()
      and t.end_date >= b.today_date
  ), my_tier as (
    select ps.skill_tier
    from public.profile_sports ps
    where ps.profile_id = auth.uid() and ps.sport = 'padel'
  ), candidates as (
    select distinct on (o.profile_id)
      o.profile_id,
      o.destination_id,
      o.start_date as trip_start,
      o.end_date as trip_end,
      greatest(m.start_date, o.start_date) as overlap_start,
      least(m.end_date, o.end_date) as overlap_end
    from mine m
    join public.trips o
      on o.destination_id = m.destination_id
     and o.visibility = 'members'
     and o.profile_id <> auth.uid()
     and o.start_date <= m.end_date
     and o.end_date >= m.start_date
    cross join bounds b
    where o.end_date >= b.today_date
    order by
      o.profile_id,
      (least(m.end_date, o.end_date) - greatest(m.start_date, o.start_date)) desc,
      o.start_date
  )
  select
    c.profile_id as player_id,
    n.public_name as display_name,
    d.id as destination_id,
    d.name as destination_name,
    ps.skill_tier,
    c.trip_start,
    c.trip_end,
    (c.overlap_end - c.overlap_start + 1)::integer as overlap_days,
    count(*) over () as total_count
  from candidates c
  join public.profiles p on p.id = c.profile_id and p.discoverable_at is not null
  join public.profile_sports ps on ps.profile_id = p.id and ps.sport = 'padel'
  join public.destinations d on d.id = c.destination_id
  cross join lateral (
    select regexp_split_to_array(btrim(p.display_name), '\s+') as parts
  ) w
  cross join lateral (
    select case
      when cardinality(w.parts) >= 2
        then w.parts[1] || ' ' || upper(left(w.parts[cardinality(w.parts)], 1)) || '.'
      else w.parts[1]
    end as public_name
  ) n
  where (
      not coalesce(p_this_week, false)
      or exists (
        select 1 from this_week wk
        where c.overlap_start <= wk.week_end and c.overlap_end >= wk.week_start
      )
    )
    and (
      not coalesce(p_my_level, false)
      or exists (
        select 1 from my_tier mt
        where abs(
          array_position(array['Beginner', 'Intermediate', 'Advanced'], mt.skill_tier)
          - array_position(array['Beginner', 'Intermediate', 'Advanced'], ps.skill_tier)
        ) <= 1
      )
    )
    and (
      nullif(btrim(p_query), '') is null
      or strpos(lower(n.public_name), lower(left(btrim(p_query), 40))) > 0
    )
    and coalesce(p_offset, 0) < 100
  order by (c.overlap_end - c.overlap_start) desc, n.public_name, c.profile_id
  limit greatest(least(coalesce(p_limit, 50), 50), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.find_overlapping_players(uuid, boolean, boolean, text, date, integer, integer)
  from public, anon, authenticated;
grant execute on function public.find_overlapping_players(uuid, boolean, boolean, text, date, integer, integer)
  to authenticated;
