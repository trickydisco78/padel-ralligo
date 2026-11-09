-- Destinations, profiles, per-sport skill, saved trip and sign-up consents.
-- Access is enforced here with row-level security; the app never uses the service-role key.

-- ---------------------------------------------------------------------------
-- destinations (curated list, read-only for users, edited as data)
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null,
  tagline text not null default ''
);

alter table public.destinations enable row level security;

create policy "destinations are readable by signed-in users"
  on public.destinations for select to authenticated using (true);

insert into public.destinations (name, country, tagline) values
  ('Tenerife', 'Spain', 'Year-round sun and courts'),
  ('The Algarve', 'Portugal', 'Padel and golden beaches'),
  ('Marbella', 'Spain', 'Where padel is a way of life'),
  ('Barcelona', 'Spain', 'City courts and a coastal vibe');

-- ---------------------------------------------------------------------------
-- profiles (public columns only; email stays in auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  home_city text check (home_city is null or char_length(home_city) <= 80),
  bio text not null default '' check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

create policy "users create their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- profile_sports (self-rated skill tier, keyed by sport so sports can be added)
-- ---------------------------------------------------------------------------
create table public.profile_sports (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sport text not null default 'padel' check (sport in ('padel')),
  skill_tier text not null check (skill_tier in ('Beginner', 'Intermediate', 'Advanced')),
  primary key (profile_id, sport)
);

alter table public.profile_sports enable row level security;

create policy "skill is readable by signed-in users"
  on public.profile_sports for select to authenticated using (true);

create policy "users add their own skill"
  on public.profile_sports for insert to authenticated with check (profile_id = auth.uid());

create policy "users update their own skill"
  on public.profile_sports for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- profile_trips (saved current trip; private to its owner)
-- ---------------------------------------------------------------------------
create table public.profile_trips (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id),
  start_date date not null,
  end_date date not null,
  check (end_date >= start_date)
);

alter table public.profile_trips enable row level security;

create policy "users read their own trip"
  on public.profile_trips for select to authenticated using (profile_id = auth.uid());

create policy "users save their own trip"
  on public.profile_trips for insert to authenticated with check (profile_id = auth.uid());

create policy "users update their own trip"
  on public.profile_trips for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "users remove their own trip"
  on public.profile_trips for delete to authenticated using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- user_consents (terms and 18+ confirmation, stamped by the server at sign up)
-- ---------------------------------------------------------------------------
create table public.user_consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  terms_accepted_at timestamptz not null default now(),
  age_confirmed_at timestamptz not null default now()
);

alter table public.user_consents enable row level security;

create policy "users read their own consents"
  on public.user_consents for select to authenticated using (user_id = auth.uid());

-- Block sign up unless both confirmations were given, and record them with server time.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', '') <> 'true'
     or coalesce(new.raw_user_meta_data ->> 'age_confirmed', '') <> 'true' then
    raise exception 'Terms and age confirmation are required';
  end if;

  insert into public.user_consents (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants: signed-in users only; anonymous requests get nothing.
-- ---------------------------------------------------------------------------
revoke all on public.destinations, public.profiles, public.profile_sports,
  public.profile_trips, public.user_consents from anon;

grant select on public.destinations to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.profile_sports to authenticated;
grant select, insert, update, delete on public.profile_trips to authenticated;
grant select on public.user_consents to authenticated;
