-- Join requests: a member asks for a place in a match, the organiser accepts or declines.
-- Every write goes through a SECURITY DEFINER function that checks the caller, the match and its
-- capacity itself; the table has no insert, update or delete grant. Anonymous callers get nothing.
-- "Full" is derived (accepted players = players_needed), not a listing status, so a withdrawal
-- reopens a match with no extra step.

-- ---------------------------------------------------------------------------
-- join_requests
-- ---------------------------------------------------------------------------
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (listing_id, profile_id)
);

create index join_requests_listing_status_idx on public.join_requests (listing_id, status);
create index join_requests_profile_idx on public.join_requests (profile_id);

alter table public.join_requests enable row level security;

-- A member reads their own requests. The organiser reads requests only through match_people().
create policy "members read their own join requests"
  on public.join_requests for select to authenticated using (profile_id = auth.uid());

revoke all on public.join_requests from public, anon, authenticated;
grant select on public.join_requests to authenticated;

-- ---------------------------------------------------------------------------
-- public_name_of: first name plus last initial, as the player directory does ("Jordi M.")
-- Internal helper: not executable by any client role.
-- ---------------------------------------------------------------------------
create function public.public_name_of(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when cardinality(w.parts) >= 2
      then w.parts[1] || ' ' || upper(left(w.parts[cardinality(w.parts)], 1)) || '.'
    else w.parts[1]
  end
  from (select regexp_split_to_array(btrim(p_name), '\s+') as parts) w;
$$;

revoke all on function public.public_name_of(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- request_to_join
--   * signed in, verified email, a profile
--   * not the organiser; match open, current and not full
--   * a pending, accepted or declined request blocks a new one; a withdrawn one is reopened
--   * the listing row is locked first so capacity and the one-request rule cannot be raced
-- Errors are stable codes in the message, translated by the app.
-- ---------------------------------------------------------------------------
create function public.request_to_join(p_listing uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings;
  v_existing public.join_requests;
  v_accepted integer;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if not public.is_email_confirmed() then
    raise exception 'email_not_confirmed';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile_incomplete';
  end if;

  select * into v_listing from public.listings where id = p_listing for update;
  if not found then
    raise exception 'not_found';
  end if;
  if v_listing.poster_id = auth.uid() then
    raise exception 'own_match';
  end if;
  if v_listing.status <> 'open' then
    raise exception 'match_closed';
  end if;
  if coalesce(v_listing.end_date, v_listing.start_date) < current_date then
    raise exception 'match_past';
  end if;

  select count(*) into v_accepted
  from public.join_requests where listing_id = p_listing and status = 'accepted';
  if v_accepted >= v_listing.players_needed then
    raise exception 'match_full';
  end if;

  select * into v_existing
  from public.join_requests where listing_id = p_listing and profile_id = auth.uid();
  if found then
    if v_existing.status = 'declined' then
      raise exception 'declined';
    elsif v_existing.status in ('pending', 'accepted') then
      raise exception 'already_requested';
    end if;
    update public.join_requests
      set status = 'pending', created_at = now(), decided_at = null
      where id = v_existing.id;
  else
    insert into public.join_requests (listing_id, profile_id) values (p_listing, auth.uid());
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- withdraw_join_request
--   * the caller's own pending request, or accepted request while the match has not started
-- ---------------------------------------------------------------------------
create function public.withdraw_join_request(p_listing uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings;
  v_request public.join_requests;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_listing from public.listings where id = p_listing for update;
  if not found then
    raise exception 'not_found';
  end if;

  select * into v_request
  from public.join_requests
  where listing_id = p_listing and profile_id = auth.uid()
  for update;
  if not found then
    raise exception 'not_found';
  end if;
  if v_request.status not in ('pending', 'accepted') then
    raise exception 'not_pending';
  end if;
  if v_request.status = 'accepted' and v_listing.start_date < current_date then
    raise exception 'match_past';
  end if;

  update public.join_requests
    set status = 'withdrawn', decided_at = now()
    where id = v_request.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- decide_join_request
--   * only the organiser of the request's match, on a pending request, in an open current match
--   * accepting needs a place left; declining a request on a full match is allowed
-- ---------------------------------------------------------------------------
create function public.decide_join_request(p_request uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing_id uuid;
  v_listing public.listings;
  v_request public.join_requests;
  v_accepted integer;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select listing_id into v_listing_id from public.join_requests where id = p_request;
  if not found then
    raise exception 'not_found';
  end if;

  -- Lock the listing before the request, as the other functions do, so they cannot deadlock.
  select * into v_listing from public.listings where id = v_listing_id for update;
  if v_listing.poster_id <> auth.uid() then
    raise exception 'not_organiser';
  end if;

  select * into v_request from public.join_requests where id = p_request for update;
  if v_request.status <> 'pending' then
    raise exception 'not_pending';
  end if;
  if v_listing.status <> 'open' then
    raise exception 'match_closed';
  end if;
  if coalesce(v_listing.end_date, v_listing.start_date) < current_date then
    raise exception 'match_past';
  end if;

  if p_accept then
    select count(*) into v_accepted
    from public.join_requests where listing_id = v_listing_id and status = 'accepted';
    if v_accepted >= v_listing.players_needed then
      raise exception 'match_full';
    end if;
    update public.join_requests set status = 'accepted', decided_at = now() where id = p_request;
  else
    update public.join_requests set status = 'declined', decided_at = now() where id = p_request;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- match_people: who the caller may see on a match
--   * everyone signed in: the organiser and the accepted players (first name, last initial, tier)
--   * the organiser also: each pending request, with its id, and the pending count
--   * a member with a request: their own status in own_status (never anyone else's request)
--   * viewer_role says which of organiser, requester or member the caller is
--   * no email, user id, home destination, city or message is ever returned
-- ---------------------------------------------------------------------------
create function public.match_people(p_listing uuid)
returns table (
  viewer_role text,
  own_status text,
  players_needed integer,
  accepted_count integer,
  pending_count integer,
  person_kind text,
  request_id uuid,
  person_name text,
  skill_tier text,
  request_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_listing public.listings;
  v_own text;
  v_role text;
  v_accepted integer;
  v_pending integer;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_listing from public.listings l where l.id = p_listing;
  if not found then
    return;
  end if;

  select r.status into v_own
  from public.join_requests r
  where r.listing_id = p_listing and r.profile_id = auth.uid();

  v_role := case
    when v_listing.poster_id = auth.uid() then 'organiser'
    when v_own is not null then 'requester'
    else 'member'
  end;

  select count(*) filter (where r.status = 'accepted'), count(*) filter (where r.status = 'pending')
  into v_accepted, v_pending
  from public.join_requests r
  where r.listing_id = p_listing;

  return query
  with people as (
    select 'organiser'::text as kind, null::uuid as rid, v_listing.poster_id as pid,
           null::text as st, 0 as ord, null::timestamptz as sort_at
    union all
    select 'player', r.id, r.profile_id, r.status, 1, r.decided_at
    from public.join_requests r
    where r.listing_id = p_listing and r.status = 'accepted'
    union all
    select 'request', r.id, r.profile_id, r.status, 2, r.created_at
    from public.join_requests r
    where r.listing_id = p_listing and r.status = 'pending' and v_role = 'organiser'
  )
  select
    v_role,
    v_own,
    v_listing.players_needed::integer,
    v_accepted,
    case when v_role = 'organiser' then v_pending end,
    k.kind,
    case when k.kind = 'request' then k.rid end,
    public.public_name_of(p.display_name),
    ps.skill_tier,
    case when k.kind = 'request' then k.st end
  from people k
  join public.profiles p on p.id = k.pid
  left join public.profile_sports ps on ps.profile_id = p.id and ps.sport = v_listing.sport
  order by k.ord, k.sort_at, k.pid;
end;
$$;

revoke all on function public.request_to_join(uuid) from public, anon;
revoke all on function public.withdraw_join_request(uuid) from public, anon;
revoke all on function public.decide_join_request(uuid, boolean) from public, anon;
revoke all on function public.match_people(uuid) from public, anon;
grant execute on function public.request_to_join(uuid) to authenticated;
grant execute on function public.withdraw_join_request(uuid) to authenticated;
grant execute on function public.decide_join_request(uuid, boolean) to authenticated;
grant execute on function public.match_people(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- players_needed cannot drop below the number of accepted players
-- (security definer: the poster cannot read other members' join requests directly)
-- ---------------------------------------------------------------------------
create function public.reject_players_below_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.players_needed < (
    select count(*) from public.join_requests r where r.listing_id = new.id and r.status = 'accepted'
  ) then
    raise exception 'players_below_accepted';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_players_below_accepted() from public, anon, authenticated;

create trigger listings_reject_players_below_accepted
  before update of players_needed on public.listings
  for each row
  when (new.players_needed is distinct from old.players_needed)
  execute function public.reject_players_below_accepted();

-- ---------------------------------------------------------------------------
-- Read models: places left, and counts that skip full matches.
-- discover_listings still returns a full match (spots_left = 0) so people involved can open it;
-- the app's list queries hide it. spots_left is one more public number, nothing else.
-- ---------------------------------------------------------------------------
create or replace view public.discover_listings
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
  ps.skill_tier as poster_skill_tier,
  (
    l.players_needed - (
      select count(*) from public.join_requests r where r.listing_id = l.id and r.status = 'accepted'
    )
  )::integer as spots_left
from public.listings l
join public.destinations d on d.id = l.destination_id
join public.profiles p on p.id = l.poster_id
left join public.profile_sports ps on ps.profile_id = l.poster_id and ps.sport = l.sport
where l.status = 'open'
  and coalesce(l.end_date, l.start_date) >= current_date;

create or replace view public.destinations_with_counts
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
      and l.players_needed > (
        select count(*) from public.join_requests r where r.listing_id = l.id and r.status = 'accepted'
      )
  )::int as open_listings
from public.destinations d;
