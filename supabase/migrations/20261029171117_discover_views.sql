-- Read models for Discover. Both use security_invoker, so row-level security applies to the caller.
-- Neither exposes email addresses or consent timestamps.

create view public.discover_listings
with (security_invoker = true) as
select
  l.id,
  l.poster_id,
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
with (security_invoker = true) as
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

revoke all on public.discover_listings, public.destinations_with_counts from anon;
grant select on public.discover_listings, public.destinations_with_counts to authenticated;
