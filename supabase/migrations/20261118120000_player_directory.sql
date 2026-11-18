-- Player directory: opt-in discoverability, a home destination, and one controlled public read.
-- Nothing is listed by this migration: every existing profile keeps discoverable_at = null.
-- Anonymous callers get no table or view grant; they can only execute public.search_players, which
-- returns a minimum of public fields and enforces its own result caps.

-- ---------------------------------------------------------------------------
-- profiles: opt-in timestamp and home destination
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column discoverable_at timestamptz,
  add column home_destination_id uuid references public.destinations (id),
  add constraint profiles_listed_needs_home_destination
    check (discoverable_at is null or home_destination_id is not null);

-- ---------------------------------------------------------------------------
-- destinations: two more curated places
-- ---------------------------------------------------------------------------
insert into public.destinations (name, country, tagline) values
  ('Málaga', 'Spain', 'Sun, sea and courts on the Costa del Sol'),
  ('Lisbon', 'Portugal', 'Padel across the seven hills')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- search_players
--   * only players who opted in, have a home destination and a padel skill tier
--   * display_name is first name plus last initial ("Jordi M."), never the full name
--   * player_id is returned only to signed-in callers; guests get null
--   * the caller's own row is excluded
--   * text search matches destination name or country, never player names
--   * at most 50 rows per call, and nothing at all from offset 100 onwards
--   * total_count is the number of matches before the page is cut
-- ---------------------------------------------------------------------------
create function public.search_players(
  p_destination_id uuid default null,
  p_query text default null,
  p_level text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  player_id uuid,
  display_name text,
  destination_id uuid,
  destination_name text,
  skill_tier text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when auth.uid() is not null then p.id end as player_id,
    n.public_name as display_name,
    d.id as destination_id,
    d.name as destination_name,
    ps.skill_tier,
    count(*) over () as total_count
  from public.profiles p
  join public.destinations d on d.id = p.home_destination_id
  join public.profile_sports ps on ps.profile_id = p.id and ps.sport = 'padel'
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
  where p.discoverable_at is not null
    and p.id is distinct from auth.uid()
    and (p_destination_id is null or d.id = p_destination_id)
    and (p_level is null or ps.skill_tier = p_level)
    and (
      nullif(btrim(p_query), '') is null
      or strpos(lower(d.name), lower(left(btrim(p_query), 40))) > 0
      or strpos(lower(d.country), lower(left(btrim(p_query), 40))) > 0
    )
    and coalesce(p_offset, 0) < 100
  order by n.public_name, p.id
  limit greatest(least(coalesce(p_limit, 50), 50), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_players(uuid, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.search_players(uuid, text, text, integer, integer)
  to anon, authenticated;
