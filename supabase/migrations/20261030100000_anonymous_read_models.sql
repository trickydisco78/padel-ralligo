-- Anonymous browsing: visitors can read the two Discover read models and nothing else.
-- The views run with the owner's rights (security_invoker = false), so the base tables keep no
-- grants for anon and stay unreadable through the API. The column lists below are the only data
-- an anonymous request can see: no email, consent timestamps, trips, bios, cities or user ids.
-- poster_id is dropped on purpose; a stable id would let visitors correlate posters.

drop view if exists public.discover_listings;
drop view if exists public.destinations_with_counts;

create view public.discover_listings
with (security_invoker = false) as
select
  l.id,
  l.destination_id,
  d.name as destination_name,
  d.country as destination_country,
  l.start_date,
  l.end_date,
  l.start_time,
  l.venue,
  l.level_wanted,
  l.players_needed,
  l.description,
  l.created_at,
  p.display_name as poster_name,
  ps.skill_tier as poster_skill_tier
from public.listings l
join public.destinations d on d.id = l.destination_id
join public.profiles p on p.id = l.poster_id
left join public.profile_sports ps on ps.profile_id = l.poster_id and ps.sport = l.sport
where l.status = 'open'
  and coalesce(l.end_date, l.start_date) >= current_date;

create view public.destinations_with_counts
with (security_invoker = false) as
select
  d.id,
  d.name,
  d.country,
  d.tagline,
  (
    select count(*)
    from public.listings l
    where l.destination_id = d.id
      and l.status = 'open'
      and coalesce(l.end_date, l.start_date) >= current_date
  )::int as open_listings
from public.destinations d;

revoke all on public.discover_listings, public.destinations_with_counts from public, anon, authenticated;
grant select on public.discover_listings, public.destinations_with_counts to anon, authenticated;
