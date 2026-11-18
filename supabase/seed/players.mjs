// Development-only players for the Find players directory, matching the supplied design.
// They are fake accounts that cannot sign in (no password) and use the reserved @seed.invalid
// email domain, so they are easy to find and remove. Connects with the same database connection
// string as the RLS tests; the value is never printed.
//
//   pnpm seed:players                  shows what would be added or removed (changes nothing)
//   pnpm seed:players -- --apply       adds the players (safe to run again)
//   pnpm seed:players -- --remove      shows what would be removed
//   pnpm seed:players -- --remove --apply
//
// The dev project is also the project the app uses, so run this only on purpose.

import pg from 'pg';

const url = process.env.SUPABASE_DB_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error('Set SUPABASE_DB_URL or POSTGRES_URL_NON_POOLING (never commit it).');
  process.exit(2);
}

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const remove = args.has('--remove');

const PLAYERS = [
  { id: '5eed0000-0000-4000-8000-000000000001', name: 'Jordi Martí', destination: 'Málaga', tier: 'Advanced' },
  { id: '5eed0000-0000-4000-8000-000000000002', name: 'Hannah Klein', destination: 'Málaga', tier: 'Intermediate' },
  { id: '5eed0000-0000-4000-8000-000000000003', name: 'Lucía Castro', destination: 'Lisbon', tier: 'Intermediate' },
  { id: '5eed0000-0000-4000-8000-000000000004', name: 'Diego Ramos', destination: 'Málaga', tier: 'Beginner' },
];

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query('begin');

  if (remove) {
    const found = await client.query(`select count(*)::int as n from auth.users where email like '%@seed.invalid'`);
    console.log(`${apply ? 'Removing' : 'Would remove'} ${found.rows[0].n} seeded account(s).`);
    if (apply) await client.query(`delete from auth.users where email like '%@seed.invalid'`);
  } else {
    for (const player of PLAYERS) {
      const email = `${player.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@seed.invalid`;
      console.log(`${apply ? 'Adding' : 'Would add'} ${player.name} (${player.destination}, ${player.tier})`);
      if (!apply) continue;

      await client.query(
        `insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
         values ($1, $2, now(), '{"terms_accepted":"true","age_confirmed":"true"}')
         on conflict (id) do nothing`,
        [player.id, email],
      );
      await client.query(
        `insert into public.profiles (id, display_name, home_destination_id, discoverable_at)
         select $1, $2, d.id, now() from public.destinations d where d.name = $3
         on conflict (id) do update set home_destination_id = excluded.home_destination_id,
           discoverable_at = coalesce(public.profiles.discoverable_at, excluded.discoverable_at)`,
        [player.id, player.name, player.destination],
      );
      await client.query(
        `insert into public.profile_sports (profile_id, sport, skill_tier) values ($1, 'padel', $2)
         on conflict (profile_id, sport) do update set skill_tier = excluded.skill_tier`,
        [player.id, player.tier],
      );
    }
  }

  await client.query(apply ? 'commit' : 'rollback');
  await client.end();
  if (!apply) console.log('\nNothing was changed. Add --apply to do it.');
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message);
  try { await client.query('rollback'); await client.end(); } catch {}
  process.exit(1);
});
