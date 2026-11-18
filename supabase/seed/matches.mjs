// Development-only open matches for Discover > Open matches, posted by the seeded players.
// Run `pnpm seed:players -- --apply` first: the posters are those fake accounts (@seed.invalid).
// Connects with the same database connection string as the RLS tests; the value is never printed.
//
//   pnpm seed:matches                  shows what would be added (changes nothing)
//   pnpm seed:matches -- --apply       replaces the seeded players' listings (safe to run again)
//   pnpm seed:matches -- --remove --apply
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

const POSTER_IDS = [1, 2, 3, 4].map((n) => `5eed0000-0000-4000-8000-00000000000${n}`);

// `day` is days from today, so the data never goes stale. Covers: a time and venue, no time,
// a multi-day range, each level, and one to three spots.
const LISTINGS = [
  { poster: 1, destination: 'Málaga', day: 8, time: '18:30', venue: 'Málaga Centro', level: 'Intermediate', needed: 1, description: 'Friendly doubles, one spot left.' },
  { poster: 2, destination: 'Málaga', day: 9, time: '10:00', venue: 'La Cala', level: 'Advanced', needed: 2, description: 'Morning rally, bring water.' },
  { poster: 4, destination: 'Málaga', day: 10, time: null, venue: null, level: 'Beginner', needed: 3, description: 'Beginners welcome, relaxed pace.' },
  { poster: 1, destination: 'Málaga', day: 11, endDay: 13, time: '09:00', venue: 'Marbella Club', level: 'Any', needed: 2, description: 'Looking for a regular hit during our trip.' },
  { poster: 3, destination: 'Lisbon', day: 9, time: '19:00', venue: 'Lisbon Padel Club', level: 'Intermediate', needed: 1, description: 'After-work doubles.' },
];

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query('begin');

  const posters = await client.query(`select count(*)::int as n from public.profiles where id = any($1)`, [POSTER_IDS]);
  if (!remove && posters.rows[0].n < POSTER_IDS.length) {
    throw new Error(`Only ${posters.rows[0].n} of ${POSTER_IDS.length} seeded players exist. Run pnpm seed:players -- --apply first.`);
  }

  const existing = await client.query(`select count(*)::int as n from public.listings where poster_id = any($1)`, [POSTER_IDS]);
  console.log(`${apply ? 'Removing' : 'Would remove'} ${existing.rows[0].n} existing seeded listing(s).`);
  if (apply) await client.query(`delete from public.listings where poster_id = any($1)`, [POSTER_IDS]);

  if (!remove) {
    for (const l of LISTINGS) {
      console.log(
        `${apply ? 'Adding' : 'Would add'} ${l.destination} in ${l.day}${l.endDay ? ` to ${l.endDay}` : ''} days, ` +
          `${l.level}, ${l.needed} spot(s), ${l.venue ?? 'no venue'}`,
      );
      if (!apply) continue;
      await client.query(
        `insert into public.listings
           (poster_id, destination_id, start_date, end_date, start_time, venue, level_wanted, players_needed, description)
         select $1, d.id, current_date + $3::int, case when $4::int is null then null else current_date + $4::int end,
                $5::time, $6, $7, $8, $9
         from public.destinations d where d.name = $2`,
        [POSTER_IDS[l.poster - 1], l.destination, l.day, l.endDay ?? null, l.time, l.venue, l.level, l.needed, l.description],
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
