// Development-only accounts and a match for trying join requests on a device.
//
//   carlos@seed.invalid  Carlos Martín, the organiser. CAN sign in. Has a Málaga match with three places,
//                        one already accepted (Emma) and one request waiting (Hannah, if seeded).
//   david@seed.invalid   David Keane, a requester. CAN sign in. Has made no request yet.
//   emma@seed.invalid    Emma Reid, an accepted player. Cannot sign in (no password), like the other seeds.
//
// Both sign-in accounts share one throwaway password for the dev project (which holds no real users).
// Pass SEED_TESTER_PASSWORD to choose it; otherwise one is generated and printed once, on --apply.
// Everything uses the reserved @seed.invalid domain, so `pnpm seed:players -- --remove --apply` removes it too.
// Connects with the same database connection string as the RLS tests; the value is never printed.
//
//   pnpm seed:testers                  shows what would be added (changes nothing)
//   pnpm seed:testers -- --apply       adds the accounts and the match (safe to run again: it resets them)
//   pnpm seed:testers -- --remove --apply
//
// The dev project is also the project the app uses, so run this only on purpose.

import { randomBytes } from 'node:crypto';
import pg from 'pg';

const url = process.env.SUPABASE_DB_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error('Set SUPABASE_DB_URL or POSTGRES_URL_NON_POOLING (never commit it).');
  process.exit(2);
}

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const remove = args.has('--remove');

const ID = (n) => `5eed0000-0000-4000-8000-0000000000${n}`;
const ACCOUNTS = [
  { id: ID('c1'), email: 'carlos@seed.invalid', name: 'Carlos Martín', tier: 'Advanced', signIn: true },
  { id: ID('d1'), email: 'david@seed.invalid', name: 'David Keane', tier: 'Beginner', signIn: true },
  { id: ID('e1'), email: 'emma@seed.invalid', name: 'Emma Reid', tier: 'Intermediate', signIn: false },
];
const HANNAH = '5eed0000-0000-4000-8000-000000000002'; // from `pnpm seed:players`

const generated = !process.env.SEED_TESTER_PASSWORD;
const password = process.env.SEED_TESTER_PASSWORD ?? randomBytes(9).toString('base64url');

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query('begin');
  const ids = ACCOUNTS.map((a) => a.id);

  if (remove) {
    const found = await client.query(`select count(*)::int as n from auth.users where id = any($1)`, [ids]);
    console.log(`${apply ? 'Removing' : 'Would remove'} ${found.rows[0].n} account(s) and their match and requests.`);
    if (apply) await client.query(`delete from auth.users where id = any($1)`, [ids]);
  } else {
    for (const a of ACCOUNTS) {
      console.log(`${apply ? 'Adding' : 'Would add'} ${a.name} <${a.email}> (${a.tier}, ${a.signIn ? 'can sign in' : 'cannot sign in'})`);
      if (!apply) continue;
      await client.query(`delete from auth.users where id = $1`, [a.id]);
      await client.query(
        `insert into auth.users
           (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change, email_change_token_new)
         values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2,
                 case when $3::boolean then extensions.crypt($4, extensions.gen_salt('bf')) else '' end, now(),
                 '{"provider":"email","providers":["email"]}',
                 '{"terms_accepted":"true","age_confirmed":"true"}', now(), now(), '', '', '', '')`,
        [a.id, a.email, a.signIn, password],
      );
      if (a.signIn) {
        // Without an email identity, password sign-in does not work.
        await client.query(
          `insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
           values (gen_random_uuid(), $1::uuid, $3::text, 'email',
                   jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true), now(), now(), now())`,
          [a.id, a.email, a.id],
        );
      }
      await client.query(`insert into public.profiles (id, display_name) values ($1, $2)`, [a.id, a.name]);
      await client.query(`insert into public.profile_sports (profile_id, sport, skill_tier) values ($1, 'padel', $2)`, [a.id, a.tier]);
    }

    console.log(`${apply ? 'Adding' : 'Would add'} Carlos's Málaga match: 3 places, Emma accepted, Hannah waiting`);
    if (apply) {
      const { rows } = await client.query(
        `insert into public.listings
           (poster_id, destination_id, start_date, start_time, venue, level_wanted, players_needed, description)
         select $1, d.id, current_date + 6, '18:30', 'Málaga Centro', 'Any', 3,
                'Friendly doubles. Good vibes and balanced play.'
         from public.destinations d where d.name = 'Málaga' returning id`,
        [ACCOUNTS[0].id],
      );
      const listing = rows[0].id;
      await client.query(
        `insert into public.join_requests (listing_id, profile_id, status, decided_at) values ($1, $2, 'accepted', now())`,
        [listing, ACCOUNTS[2].id],
      );
      const hannah = await client.query(`select 1 from public.profiles where id = $1`, [HANNAH]);
      if (hannah.rowCount === 1) {
        await client.query(`insert into public.join_requests (listing_id, profile_id) values ($1, $2)`, [listing, HANNAH]);
      } else {
        console.log('(Hannah is not seeded, so there is no waiting request. Run pnpm seed:players -- --apply to add her.)');
      }
    }
  }

  await client.query(apply ? 'commit' : 'rollback');
  await client.end();
  if (!apply) console.log('\nNothing was changed. Add --apply to do it.');
  else if (!remove) {
    console.log('\nSign in with carlos@seed.invalid (organiser) or david@seed.invalid (requester).');
    console.log(generated ? `Password (shown once, throwaway): ${password}` : 'Password: the value of SEED_TESTER_PASSWORD.');
  }
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message);
  try { await client.query('rollback'); await client.end(); } catch {}
  process.exit(1);
});
