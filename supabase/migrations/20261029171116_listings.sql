-- Match listings: a fixed match or a loose invite, one record.

-- True when the signed-in user's email address has been verified.
-- Lives in public so row-level security can call it; it only ever answers for the caller.
create function public.is_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select email_confirmed_at is not null from auth.users where id = auth.uid()),
    false
  );
$$;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id),
  sport text not null default 'padel' check (sport in ('padel')),
  start_date date not null,
  end_date date,
  start_time time,
  venue text check (venue is null or char_length(venue) <= 120),
  level_wanted text not null
    check (level_wanted in ('Any', 'Beginner', 'Intermediate', 'Advanced')),
  players_needed smallint not null check (players_needed between 1 and 3),
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index listings_destination_start_idx on public.listings (destination_id, start_date);
create index listings_poster_idx on public.listings (poster_id);

-- A start date in the past is rejected when a listing is created or its start date changes.
-- (Not a CHECK constraint, because that would also block closing an old listing.)
create function public.reject_past_start_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.start_date < current_date
     and (tg_op = 'INSERT' or new.start_date is distinct from old.start_date) then
    raise exception 'Start date cannot be in the past';
  end if;
  return new;
end;
$$;

create trigger listings_reject_past_start_date
  before insert or update on public.listings
  for each row execute function public.reject_past_start_date();

alter table public.listings enable row level security;

create policy "open listings and your own are readable by signed-in users"
  on public.listings for select to authenticated
  using (status = 'open' or poster_id = auth.uid());

create policy "verified users post as themselves"
  on public.listings for insert to authenticated
  with check (poster_id = auth.uid() and public.is_email_confirmed());

create policy "posters update their own listings"
  on public.listings for update to authenticated
  using (poster_id = auth.uid()) with check (poster_id = auth.uid());

revoke all on public.listings from anon;
grant select, insert, update on public.listings to authenticated;
revoke all on function public.is_email_confirmed() from public, anon;
grant execute on function public.is_email_confirmed() to authenticated;
