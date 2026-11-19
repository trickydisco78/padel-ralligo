// Row-level security checks for the dev project. Everything runs in one transaction that is
// rolled back, so no data is left behind. Needs a database connection string in
// POSTGRES_URL_NON_POOLING (or SUPABASE_DB_URL); the value is never printed.
//
//   pnpm test:rls      (loads supabase/tests/.env.local, which holds SUPABASE_DB_URL; gitignored)

import pg from 'pg';

const url = process.env.SUPABASE_DB_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error('Set SUPABASE_DB_URL or POSTGRES_URL_NON_POOLING (never commit it).');
  const names = Object.keys(process.env).filter((k) => /supabase|postgres/i.test(k)).sort();
  console.error(`Variables found (names only): ${names.join(', ') || 'none'}`);
  process.exit(2);
}

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

const ids = {
  a: '00000000-0000-4000-8000-00000000000a', // verified, has profile
  b: '00000000-0000-4000-8000-00000000000b', // verified, has profile
  c: '00000000-0000-4000-8000-00000000000c', // email NOT verified, has profile
  d: '00000000-0000-4000-8000-00000000000d', // verified, has profile but no skill tier
  eva: '00000000-0000-4000-8000-00000000000e', // listed, Beginner, shared trip
  finn: '00000000-0000-4000-8000-00000000000f', // listed, Advanced, shared trip
  gus: '00000000-0000-4000-8000-000000000001', // listed, Intermediate, trip NOT shared
  hal: '00000000-0000-4000-8000-000000000002', // listed, shared trip to another destination
  ida: '00000000-0000-4000-8000-000000000003', // listed, shared trip that does not overlap
  lena: '00000000-0000-4000-8000-000000000004', // listed, Intermediate, shared trip
};

let passed = 0;
let failed = 0;

async function asRole(role, userId) {
  await client.query('reset role');
  await client.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify(userId ? { sub: userId, role } : { role }),
  ]);
  await client.query(`set local role ${role}`);
}

/** Runs `fn` in a savepoint. `expect` is 'ok' or 'deny'. */
async function check(name, expect, fn) {
  await client.query('savepoint s');
  let outcome;
  let detail = '';
  try {
    detail = String((await fn()) ?? '');
    outcome = 'ok';
  } catch (error) {
    outcome = 'deny';
    detail = error.message;
  }
  await client.query('rollback to savepoint s');
  await client.query('reset role');
  const good = outcome === expect && (expect === 'deny' || detail !== 'FALSE');
  if (good) passed += 1;
  else failed += 1;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `  (got ${outcome}: ${detail})`}`);
}

/** Like check(), but passes only when the call fails with exactly this error code (the message). */
async function checkCode(name, code, fn) {
  await client.query('savepoint s');
  let got = 'no error';
  try {
    await fn();
  } catch (error) {
    got = error.message;
  }
  await client.query('rollback to savepoint s');
  await client.query('reset role');
  const good = got === code;
  if (good) passed += 1;
  else failed += 1;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `  (wanted ${code}, got ${got})`}`);
}

// Synchronous on purpose: callers do not await it, and a failed assertion must throw inside the check.
const expectRows = (n) => (res) => {
  if (res.rowCount !== n) throw new Error(`expected ${n} rows, got ${res.rowCount}`);
};

async function main() {
  await client.connect();
  await client.query('begin');

  // Optional: load a migration that has not been applied yet, inside this rolled-back transaction,
  // so its SQL and these checks can be tried without changing the database.
  //   RLS_PRE_SQL=supabase/migrations/<file>.sql pnpm test:rls
  if (process.env.RLS_PRE_SQL) {
    const { readFileSync } = await import('node:fs');
    await client.query(readFileSync(process.env.RLS_PRE_SQL, 'utf8'));
    console.log(`(loaded ${process.env.RLS_PRE_SQL} inside the test transaction)\n`);
  }

  // Development seed players (pnpm seed:players) would show up in directory and overlap results.
  // They are removed inside this rolled-back transaction so the checks do not depend on them.
  await client.query(`delete from auth.users where email like '%@seed.invalid'`);

  // --- fixtures (as the database owner) ---
  const user = (id, confirmed) =>
    client.query(
      `insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
       values ($1, $2, ${confirmed ? 'now()' : 'null'}, '{"terms_accepted":"true","age_confirmed":"true"}')`,
      [id, `${id.slice(-1)}@rls-test.invalid`],
    );
  await user(ids.a, true);
  await user(ids.b, true);
  await user(ids.c, false);
  await user(ids.d, true);
  for (const [name, id] of [['Ann', ids.a], ['Ben', ids.b], ['Cat', ids.c]]) {
    await client.query(`insert into public.profiles (id, display_name) values ($1, $2)`, [id, name]);
    await client.query(`insert into public.profile_sports (profile_id, skill_tier) values ($1, 'Intermediate')`, [id]);
  }
  const { rows: [dest] } = await client.query(`select id from public.destinations where name = 'Marbella'`);
  // Player directory fixtures: Ann (Marbella) and Ben (Tenerife) opted in; Cat has not; Dee opted in
  // but has no skill tier, so she is never listed.
  await client.query(`insert into public.profiles (id, display_name) values ($1, 'Dee')`, [ids.d]);
  const { rows: [tenerife] } = await client.query(`select id from public.destinations where name = 'Tenerife'`);
  await client.query(`update public.profiles set home_destination_id = $1, discoverable_at = now() where id = $2`, [dest.id, ids.a]);
  await client.query(`update public.profiles set home_destination_id = $1, discoverable_at = now() where id = $2`, [tenerife.id, ids.b]);
  await client.query(`update public.profiles set home_destination_id = $1, discoverable_at = now() where id = $2`, [dest.id, ids.d]);
  const listing = (poster, extra = '') =>
    `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed${extra ? ', ' + extra.split('=')[0] : ''})
     values ('${poster}', '${dest.id}', current_date + 5, 'Any', 2${extra ? ', ' + extra.split('=')[1] : ''}) returning id`;
  const { rows: [aListing] } = await client.query(listing(ids.a));

  // --- sign-up rules ---
  await check('sign up without terms/age flags is rejected', 'deny', () =>
    client.query(`insert into auth.users (id, email) values (gen_random_uuid(), 'x@rls-test.invalid')`));
  await check('sign up records server-stamped consents', 'ok', async () => {
    const r = await client.query(`select 1 from public.user_consents where user_id = $1 and terms_accepted_at is not null and age_confirmed_at is not null`, [ids.a]);
    if (r.rowCount !== 1) throw new Error('missing consent row');
  });

  // --- anonymous: base tables are closed ---
  for (const table of ['destinations', 'profiles', 'profile_sports', 'profile_trips', 'listings', 'user_consents']) {
    await check(`anon cannot read ${table}`, 'deny', async () => {
      await asRole('anon');
      return client.query(`select * from public.${table}`);
    });
  }
  for (const sql of [
    `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date + 5, 'Any', 2)`,
    `update public.listings set status = 'closed'`,
    `delete from public.listings`,
    `insert into public.profiles (id, display_name) values (gen_random_uuid(), 'Anon')`,
    `update public.profiles set display_name = 'Hacked'`,
    `insert into public.destinations (name, country, tagline) values ('X', 'Y', 'Z')`,
    `update public.destinations set name = 'X'`,
    `delete from public.destinations`,
    `delete from public.discover_listings`,
  ]) {
    await check(`anon write rejected: ${sql.split(' ').slice(0, 3).join(' ')}`, 'deny', async () => {
      await asRole('anon');
      return client.query(sql);
    });
  }

  // --- anonymous: the two read models ---
  const anonColumns = {
    discover_listings: [
      'id', 'destination_id', 'destination_name', 'destination_country', 'start_date', 'end_date',
      'start_time', 'venue', 'level_wanted', 'players_needed', 'description', 'created_at',
      'poster_name', 'poster_skill_tier', 'spots_left',
    ],
    destinations_with_counts: ['id', 'name', 'country', 'tagline', 'open_listings'],
  };
  for (const [view, columns] of Object.entries(anonColumns)) {
    await check(`anon sees exactly the permitted columns of ${view}`, 'ok', async () => {
      await asRole('anon');
      const r = await client.query(`select * from public.${view} limit 1`);
      const got = r.fields.map((f) => f.name).sort().join(',');
      const want = [...columns].sort().join(',');
      if (got !== want) throw new Error(`columns differ: ${got}`);
    });
  }
  await check('anon reads destinations with counts (at least 4)', 'ok', async () => {
    await asRole('anon');
    const r = await client.query(`select * from public.destinations_with_counts`);
    if (r.rowCount < 4) throw new Error(`only ${r.rowCount}`);
  });
  await check('anon sees an open listing with poster name and skill only', 'ok', async () => {
    await asRole('anon');
    const r = await client.query(`select poster_name, poster_skill_tier from public.discover_listings where id = $1`, [aListing.id]);
    if (r.rowCount !== 1 || r.rows[0].poster_name !== 'Ann' || r.rows[0].poster_skill_tier !== 'Intermediate') throw new Error('missing or wrong');
  });
  await check('anon does not see a closed listing', 'ok', async () => {
    await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]);
    await asRole('anon');
    expectRows(0)(await client.query(`select 1 from public.discover_listings where id = $1`, [aListing.id]));
  });
  await check('anon does not see a past listing', 'ok', async () => {
    // The past-date trigger blocks inserts, so move the dates back as the owner with it disabled.
    await client.query(`alter table public.listings disable trigger listings_reject_past_start_date`);
    await client.query(`update public.listings set start_date = current_date - 3, end_date = current_date - 2 where id = $1`, [aListing.id]);
    await client.query(`alter table public.listings enable trigger listings_reject_past_start_date`);
    await asRole('anon');
    expectRows(0)(await client.query(`select 1 from public.discover_listings where id = $1`, [aListing.id]));
  });

  // --- anonymous: match details by id (the guest-first match screen) ---
  const detailColumns = anonColumns.discover_listings;
  await check('anon reads one open match by id with exactly the permitted columns', 'ok', async () => {
    await client.query(`update public.listings set status = 'open', start_date = current_date + 5, end_date = null where id = $1`, [aListing.id]);
    await asRole('anon');
    const r = await client.query(`select ${detailColumns.join(', ')} from public.discover_listings where id = $1`, [aListing.id]);
    if (r.rowCount !== 1) throw new Error(`expected 1 row, got ${r.rowCount}`);
    const star = await client.query(`select * from public.discover_listings where id = $1`, [aListing.id]);
    const got = star.fields.map((f) => f.name).sort().join(',');
    if (got !== [...detailColumns].sort().join(',')) throw new Error(`columns differ: ${got}`);
    if (star.fields.some((f) => /poster_id|email|user_id|consent/i.test(f.name))) throw new Error('private column exposed');
  });
  await check('anon gets no row for an unknown match id', 'ok', async () => {
    await asRole('anon');
    expectRows(0)(await client.query(`select 1 from public.discover_listings where id = gen_random_uuid()`));
  });
  await check('anon has select on exactly the two read models and no write privilege anywhere', 'ok', async () => {
    const r = await client.query(
      `select c.relname, p.privilege
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
       cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) as p(privilege)
       where c.relkind in ('r', 'v', 'm', 'p') and has_table_privilege('anon', c.oid, p.privilege)
       order by c.relname, p.privilege`);
    const got = r.rows.map((x) => `${x.relname}:${x.privilege}`).join(',');
    const want = 'destinations_with_counts:SELECT,discover_listings:SELECT';
    if (got !== want) throw new Error(`anon privileges: ${got}`);
  });
  await check('anon cannot call is_email_confirmed', 'deny', async () => {
    await asRole('anon');
    return client.query('select public.is_email_confirmed()');
  });
  await check('anon cannot read a profile bio or home city', 'deny', async () => {
    await asRole('anon');
    return client.query(`select display_name, bio, home_city from public.profiles where id = '${ids.b}'`);
  });

  // --- destinations ---
  await check('signed-in user reads destinations (at least 4)', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const r = await client.query('select 1 from public.destinations');
    if (r.rowCount < 4) throw new Error('fewer than 4 destinations');
  });
  for (const sql of [
    `insert into public.destinations (name, country) values ('Nowhere', 'None')`,
    `update public.destinations set tagline = 'x'`,
    `delete from public.destinations`,
  ]) {
    await check(`user cannot change destinations: ${sql.split(' ')[0]}`, 'deny', async () => {
      await asRole('authenticated', ids.a);
      const res = await client.query(sql);
      // Without a policy, update and delete match no rows instead of raising an error.
      if (res.rowCount === 0) throw new Error('no rows changed');
      return res;
    });
  }

  // --- profiles: decided boundary, readable by every signed-in user and by nobody else ---
  await check("signed-in user can read another user's profile (decided boundary)", 'ok', async () => {
    await asRole('authenticated', ids.a);
    const r = await client.query(`select display_name, bio, home_city from public.profiles where id = '${ids.b}'`);
    if (r.rowCount !== 1 || r.rows[0].display_name !== 'Ben') throw new Error('could not read another profile');
  });

  // --- profiles ---
  await check("user cannot create someone else's profile", 'deny', async () => {
    await asRole('authenticated', ids.a);
    return client.query(`insert into public.profiles (id, display_name) values ('${ids.b}', 'Fake')`);
  });
  await check("user cannot edit another user's profile (0 rows)", 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(0)(await client.query(`update public.profiles set display_name = 'Hacked' where id = '${ids.b}'`));
  });
  await check('user edits their own profile', 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(1)(await client.query(`update public.profiles set bio = 'hi' where id = '${ids.a}'`));
  });
  await check('profile rejects a 1-character name', 'deny', async () => {
    await asRole('authenticated', ids.a);
    return client.query(`update public.profiles set display_name = 'A' where id = '${ids.a}'`);
  });
  await check("user cannot change another user's skill (0 rows)", 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(0)(await client.query(`update public.profile_sports set skill_tier = 'Advanced' where profile_id = '${ids.b}'`));
  });

  // --- trips and consents are private ---
  await client.query(`insert into public.profile_trips values ('${ids.a}', '${dest.id}', current_date, current_date + 3)`);
  await check("user cannot read another user's trip", 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(0)(await client.query('select * from public.profile_trips'));
  });
  await check("user cannot save a trip for someone else", 'deny', async () => {
    await asRole('authenticated', ids.b);
    return client.query(`insert into public.profile_trips values ('${ids.c}', '${dest.id}', current_date, current_date + 1)`);
  });
  await check('trip end before start is rejected', 'deny', async () => {
    await asRole('authenticated', ids.b);
    return client.query(`insert into public.profile_trips values ('${ids.b}', '${dest.id}', current_date + 2, current_date)`);
  });
  await check("user sees only their own consents", 'ok', async () => {
    await asRole('authenticated', ids.b);
    const r = await client.query('select user_id from public.user_consents');
    if (r.rowCount !== 1 || r.rows[0].user_id !== ids.b) throw new Error('saw other rows');
  });

  // --- listings: who can post ---
  await check('verified user posts a listing', 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(1)(await client.query(listing(ids.b)));
  });
  await check('unverified-email user cannot post', 'deny', async () => {
    await asRole('authenticated', ids.c);
    return client.query(listing(ids.c));
  });
  await check('user cannot post as someone else', 'deny', async () => {
    await asRole('authenticated', ids.b);
    return client.query(listing(ids.a));
  });

  // --- listings: validation (as the poster) ---
  const bad = {
    'players needed 0': `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date + 1, 'Any', 0)`,
    'players needed 4': `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date + 1, 'Any', 4)`,
    'end before start': `insert into public.listings (poster_id, destination_id, start_date, end_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date + 3, current_date + 2, 'Any', 1)`,
    'start in the past': `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date - 1, 'Any', 1)`,
    'description over 500': `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed, description) values ('${ids.a}', '${dest.id}', current_date + 1, 'Any', 1, repeat('a', 501))`,
    'unknown level': `insert into public.listings (poster_id, destination_id, start_date, level_wanted, players_needed) values ('${ids.a}', '${dest.id}', current_date + 1, 'Pro', 1)`,
  };
  for (const [name, sql] of Object.entries(bad)) {
    await check(`listing rejected: ${name}`, 'deny', async () => {
      await asRole('authenticated', ids.a);
      return client.query(sql);
    });
  }

  // --- listings: reading, editing, closing ---
  await check("other user sees an open listing in Discover with poster name and skill", 'ok', async () => {
    await asRole('authenticated', ids.b);
    const r = await client.query(`select poster_name, poster_skill_tier from public.discover_listings where id = $1`, [aListing.id]);
    if (r.rowCount !== 1 || r.rows[0].poster_name !== 'Ann' || r.rows[0].poster_skill_tier !== 'Intermediate') throw new Error('missing or wrong');
  });
  await check("user cannot edit another user's listing (0 rows)", 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(0)(await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]));
  });
  await check('poster closes their listing; it leaves Discover but stays theirs', 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(1)(await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]));
    const own = await client.query(`select 1 from public.listings where id = $1`, [aListing.id]);
    const feed = await client.query(`select 1 from public.discover_listings where id = $1`, [aListing.id]);
    if (own.rowCount !== 1 || feed.rowCount !== 0) throw new Error('visibility wrong after close');
  });
  await check("a closed listing is hidden from other users", 'ok', async () => {
    await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]);
    await asRole('authenticated', ids.b);
    expectRows(0)(await client.query(`select 1 from public.listings where id = $1`, [aListing.id]));
  });
  await check('poster cannot reassign a listing to someone else', 'deny', async () => {
    await asRole('authenticated', ids.a);
    return client.query(`update public.listings set poster_id = '${ids.b}' where id = $1`, [aListing.id]);
  });
  await check('destination counts reflect open listings only', 'ok', async () => {
    await client.query(`update public.listings set status = 'open' where id = $1`, [aListing.id]);
    await asRole('authenticated', ids.b);
    const r = await client.query(`select open_listings from public.destinations_with_counts where name = 'Marbella'`);
    if (r.rows[0].open_listings < 1) throw new Error(`count ${r.rows[0].open_listings}`);
  });

  // --- player directory: search_players ---
  const directoryColumns = ['player_id', 'display_name', 'destination_id', 'destination_name', 'skill_tier', 'total_count'];
  const names = (res) => res.rows.map((r) => r.display_name).sort().join(',');

  await check('anon directory returns exactly the permitted columns and no player id', 'ok', async () => {
    await asRole('anon');
    const r = await client.query(`select * from public.search_players()`);
    const got = r.fields.map((f) => f.name).sort().join(',');
    if (got !== [...directoryColumns].sort().join(',')) throw new Error(`columns differ: ${got}`);
    if (r.rowCount < 2) throw new Error(`expected opted-in players, got ${r.rowCount}`);
    if (r.rows.some((row) => row.player_id !== null)) throw new Error('player id exposed to anon');
  });
  await check('directory lists only opted-in players with a home destination and a skill tier', 'ok', async () => {
    await asRole('anon');
    const got = names(await client.query(`select * from public.search_players()`));
    if (got !== 'Ann,Ben') throw new Error(`got ${got}`); // Cat has not opted in, Dee has no tier
  });
  await check('directory shows first name and last initial only', 'ok', async () => {
    await client.query(`update public.profiles set display_name = 'Ben van der Berg' where id = $1`, [ids.b]);
    await asRole('anon');
    const got = names(await client.query(`select * from public.search_players()`));
    if (got !== 'Ann,Ben B.') throw new Error(`got ${got}`);
  });
  await check('a player who opts out disappears', 'ok', async () => {
    await client.query(`update public.profiles set discoverable_at = null where id = $1`, [ids.a]);
    await asRole('anon');
    const got = names(await client.query(`select * from public.search_players()`));
    if (got !== 'Ben') throw new Error(`got ${got}`);
  });
  await check('signed-in caller gets player ids and not their own row', 'ok', async () => {
    await asRole('authenticated', ids.b);
    const r = await client.query(`select * from public.search_players()`);
    if (names(r) !== 'Ann') throw new Error(`got ${names(r)}`);
    if (r.rows.some((row) => !row.player_id)) throw new Error('missing player id for a signed-in caller');
  });
  await check('directory filters by destination, level and destination or country text', 'ok', async () => {
    await asRole('anon');
    const byDest = names(await client.query(`select * from public.search_players($1)`, [dest.id]));
    const byText = names(await client.query(`select * from public.search_players(null, 'marbel')`));
    const byCountry = names(await client.query(`select * from public.search_players(null, 'SPAIN')`));
    const byLevel = names(await client.query(`select * from public.search_players(null, null, 'Advanced')`));
    if (byDest !== 'Ann' || byText !== 'Ann' || byCountry !== 'Ann,Ben' || byLevel !== '') {
      throw new Error(`dest=${byDest} text=${byText} country=${byCountry} level=${byLevel}`);
    }
  });
  await check('directory search never matches player names or wildcards', 'ok', async () => {
    await asRole('anon');
    for (const q of ['Ann', 'ben', '%', '_', '.*']) {
      const r = await client.query(`select 1 from public.search_players(null, $1)`, [q]);
      if (r.rowCount !== 0) throw new Error(`query ${JSON.stringify(q)} matched ${r.rowCount}`);
    }
  });
  await check('directory caps results at 50 per call and nothing from offset 100', 'ok', async () => {
    await client.query(
      `insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
       select gen_random_uuid(), 'bulk' || g || '@rls-test.invalid', now(), '{"terms_accepted":"true","age_confirmed":"true"}'
       from generate_series(1, 120) g`);
    await client.query(
      `insert into public.profiles (id, display_name, home_destination_id, discoverable_at)
       select id, 'Bulk Player', $1, now() from auth.users where email like 'bulk%@rls-test.invalid'`, [dest.id]);
    await client.query(
      `insert into public.profile_sports (profile_id, skill_tier)
       select id, 'Beginner' from public.profiles where display_name = 'Bulk Player'`);
    await asRole('anon');
    const first = await client.query(`select * from public.search_players(null, null, null, 1000, 0)`);
    const second = await client.query(`select * from public.search_players(null, null, null, 50, 50)`);
    const beyond = await client.query(`select * from public.search_players(null, null, null, 50, 100)`);
    const negative = await client.query(`select * from public.search_players(null, null, null, -5, 0)`);
    if (first.rowCount !== 50) throw new Error(`first page ${first.rowCount}`);
    if (Number(first.rows[0].total_count) < 120) throw new Error(`total_count ${first.rows[0].total_count}`);
    if (second.rowCount !== 50) throw new Error(`second page ${second.rowCount}`);
    if (beyond.rowCount !== 0) throw new Error(`offset 100 returned ${beyond.rowCount}`);
    if (negative.rowCount !== 0) throw new Error(`negative limit returned ${negative.rowCount}`);
  });
  await check('anon cannot read profiles or skills behind the directory', 'deny', async () => {
    await asRole('anon');
    return client.query(`select discoverable_at, home_destination_id from public.profiles`);
  });
  await check('a profile cannot be listed without a home destination', 'deny', async () => {
    return client.query(`update public.profiles set discoverable_at = now() where id = $1`, [ids.c]);
  });
  await check("user cannot change another user's opt-in (0 rows)", 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(0)(await client.query(`update public.profiles set discoverable_at = null where id = $1`, [ids.b]));
  });
  await check('anon can execute exactly one non-trigger function, search_players', 'ok', async () => {
    const r = await client.query(
      `select p.proname
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
       where p.prorettype <> 'trigger'::regtype and has_function_privilege('anon', p.oid, 'EXECUTE')
       order by p.proname`);
    const got = r.rows.map((x) => x.proname).join(',');
    if (got !== 'search_players') throw new Error(`anon can execute: ${got}`);
  });

  // --- trips: private to their owner, shared on purpose, overlap on the server ---
  const { rows: [tenerifeDest] } = await client.query(`select id from public.destinations where name = 'Tenerife'`);
  const base = `current_date + 10`;
  const people = [
    [ids.eva, 'Eva', 'Beginner'], [ids.finn, 'Finn', 'Advanced'], [ids.gus, 'Gus', 'Intermediate'],
    [ids.hal, 'Hal', 'Intermediate'], [ids.ida, 'Ida', 'Advanced'], [ids.lena, 'Lena', 'Intermediate'],
  ];
  for (const [id, name, tier] of people) {
    await user(id, true);
    await client.query(`insert into public.profiles (id, display_name, home_destination_id, discoverable_at) values ($1, $2, $3, now())`, [id, name, dest.id]);
    await client.query(`insert into public.profile_sports (profile_id, skill_tier) values ($1, $2)`, [id, tier]);
  }
  // Ann's own trip (hidden): Marbella, base to base + 7 = 8 days.
  const trip = async (owner, destId, from, to, visibility = 'members') => {
    const r = await client.query(
      `insert into public.trips (profile_id, destination_id, start_date, end_date, visibility)
       values ($1, $2, ${from}, ${to}, $3) returning id`, [owner, destId, visibility]);
    return r.rows[0].id;
  };
  const annTrip = await trip(ids.a, dest.id, base, `${base} + 7`, 'hidden');
  const evaTrip = await trip(ids.eva, dest.id, base, `${base} + 7`);           // 8 days with Ann
  await trip(ids.lena, dest.id, `${base} + 1`, `${base} + 6`);                   // 6 days
  await trip(ids.b, dest.id, `${base} + 3`, `${base} + 9`);                      // 5 days
  await trip(ids.finn, dest.id, `${base} + 1`, `${base} + 4`);                   // 4 days
  await trip(ids.gus, dest.id, base, `${base} + 7`, 'hidden');                   // not shared
  await trip(ids.hal, tenerifeDest.id, base, `${base} + 7`);                     // another destination
  await trip(ids.ida, dest.id, `${base} + 20`, `${base} + 25`);                  // no overlap in time
  await trip(ids.c, dest.id, base, `${base} + 7`);                               // Cat is not listed
  await trip(ids.d, dest.id, base, `${base} + 7`);                               // Dee has no skill tier

  const overlapFor = (asUser, tripId, args = '') =>
    client.query(`select * from public.find_overlapping_players($1${args ? ', ' + args : ''})`, [tripId]);
  const listNames = (res) => res.rows.map((r) => r.display_name).join(',');

  await check('anon cannot read, add or change trips', 'deny', async () => {
    await asRole('anon');
    return client.query(`select * from public.trips`);
  });
  await check('anon cannot add a trip', 'deny', async () => {
    await asRole('anon');
    return client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.a}', '${dest.id}', current_date, current_date)`);
  });
  await check("a member cannot read another member's trips", 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(0)(await client.query(`select * from public.trips where profile_id = '${ids.a}'`));
  });
  await check("a member cannot change or delete another member's trip (0 rows)", 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(0)(await client.query(`update public.trips set visibility = 'members' where id = $1`, [annTrip]));
    expectRows(0)(await client.query(`delete from public.trips where id = $1`, [annTrip]));
  });
  await check('a member cannot add a trip for someone else', 'deny', async () => {
    await asRole('authenticated', ids.b);
    return client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.a}', '${dest.id}', current_date, current_date)`);
  });
  await check('a member reads, edits and deletes their own trip', 'ok', async () => {
    await asRole('authenticated', ids.a);
    expectRows(1)(await client.query(`select 1 from public.trips where id = $1`, [annTrip]));
    expectRows(1)(await client.query(`update public.trips set visibility = 'members' where id = $1`, [annTrip]));
    expectRows(1)(await client.query(`delete from public.trips where id = $1`, [annTrip]));
  });
  await check('a trip that ends before it starts is rejected', 'deny', async () => {
    await asRole('authenticated', ids.a);
    return client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.a}', '${dest.id}', current_date + 2, current_date)`);
  });
  await check('a new trip is hidden by default', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const r = await client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.a}', '${dest.id}', current_date + 40, current_date + 41) returning visibility`);
    if (r.rows[0].visibility !== 'hidden') throw new Error(`default is ${r.rows[0].visibility}`);
  });
  await check('an unknown visibility is rejected', 'deny', async () => {
    await asRole('authenticated', ids.a);
    return client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date, visibility) values ('${ids.a}', '${dest.id}', current_date, current_date, 'public')`);
  });
  await check('the eleventh trip is refused', 'deny', async () => {
    await client.query(
      `insert into public.trips (profile_id, destination_id, start_date, end_date)
       select '${ids.lena}', '${dest.id}', current_date + 100 + g, current_date + 100 + g from generate_series(1, 9) g`);
    await asRole('authenticated', ids.lena);
    return client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.lena}', '${dest.id}', current_date + 200, current_date + 200)`);
  });
  await check('ten trips are allowed', 'ok', async () => {
    await client.query(
      `insert into public.trips (profile_id, destination_id, start_date, end_date)
       select '${ids.lena}', '${dest.id}', current_date + 100 + g, current_date + 100 + g from generate_series(1, 9) g`);
    const r = await client.query(`select count(*)::int as n from public.trips where profile_id = '${ids.lena}'`);
    if (r.rows[0].n !== 10) throw new Error(`count ${r.rows[0].n}`);
  });

  await check('anon cannot run the overview or the overlap query', 'deny', async () => {
    await asRole('anon');
    return client.query(`select * from public.my_trips_overview()`);
  });
  await check('anon cannot run the overlap query', 'deny', async () => {
    await asRole('anon');
    return overlapFor('anon', annTrip);
  });
  await check('overlap lists the design example: 8, 6, 5 and 4 days, most days first', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const r = await overlapFor('a', annTrip);
    if (listNames(r) !== 'Eva,Lena,Ben,Finn') throw new Error(`got ${listNames(r)}`);
    const days = r.rows.map((x) => x.overlap_days).join(',');
    if (days !== '8,6,5,4') throw new Error(`days ${days}`);
    if (r.rows.some((x) => !x.player_id)) throw new Error('missing player id');
  });
  await check('overlap excludes hidden trips, unlisted players, other destinations and other dates', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const r = await overlapFor('a', annTrip, `false, false, null, current_date, 50, 0`);
    for (const name of ['Gus', 'Hal', 'Ida', 'Cat', 'Dee', 'Ann']) {
      if (r.rows.some((x) => x.display_name === name)) throw new Error(`${name} should not appear`);
    }
  });
  await check('the overview counts match the list and give the trip length', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const o = await client.query(`select * from public.my_trips_overview() where trip_id = $1`, [annTrip]);
    const l = await overlapFor('a', annTrip);
    if (o.rowCount !== 1) throw new Error(`overview rows ${o.rowCount}`);
    if (o.rows[0].days !== 8) throw new Error(`days ${o.rows[0].days}`);
    if (o.rows[0].overlap_players !== 4 || Number(l.rows[0].total_count) !== 4) throw new Error(`counts ${o.rows[0].overlap_players} / ${l.rows[0].total_count}`);
  });
  await check('the overview shows only the caller\'s own upcoming trips', 'ok', async () => {
    await client.query(`insert into public.trips (profile_id, destination_id, start_date, end_date) values ('${ids.a}', '${dest.id}', current_date - 9, current_date - 5)`);
    await asRole('authenticated', ids.a);
    const o = await client.query(`select * from public.my_trips_overview()`);
    if (o.rows.some((x) => new Date(x.end_date) < new Date(new Date().toDateString()))) throw new Error('an ended trip is listed');
    await asRole('authenticated', ids.b);
    const other = await client.query(`select * from public.my_trips_overview()`);
    if (other.rows.some((x) => x.trip_id === annTrip)) throw new Error("another member's trip is listed");
  });
  await check("a supplied trip id that belongs to someone else returns nothing", 'ok', async () => {
    await asRole('authenticated', ids.b);
    expectRows(0)(await overlapFor('b', annTrip));
    expectRows(0)(await overlapFor('b', '00000000-0000-4000-8000-0000000000ff'));
  });
  await check('My level keeps the caller\'s tier and the one next to it, at the low end', 'ok', async () => {
    await asRole('authenticated', ids.eva); // Beginner
    const all = await overlapFor('eva', evaTrip);
    const mine = await overlapFor('eva', evaTrip, `true`);
    // Eva's own trip overlaps Lena (Intermediate), Ben (Intermediate) and Finn (Advanced); Ann's trip is hidden.
    if (listNames(all) !== 'Lena,Ben,Finn') throw new Error(`all: ${listNames(all)}`);
    if (listNames(mine) !== 'Lena,Ben') throw new Error(`my level: ${listNames(mine)}`);
  });
  await check('My level in the middle keeps the tier below and above', 'ok', async () => {
    await asRole('authenticated', ids.a); // Intermediate
    const mine = await overlapFor('a', annTrip, `true`);
    if (listNames(mine) !== 'Eva,Lena,Ben,Finn') throw new Error(`got ${listNames(mine)}`);
  });
  await check('My level at the high end drops Beginners', 'ok', async () => {
    await client.query(`update public.profile_sports set skill_tier = 'Advanced' where profile_id = '${ids.a}'`);
    await asRole('authenticated', ids.a);
    const mine = await overlapFor('a', annTrip, `true`);
    if (listNames(mine) !== 'Lena,Ben,Finn') throw new Error(`got ${listNames(mine)}`);
  });
  await check('This week keeps only overlaps that include a day of this week', 'ok', async () => {
    const week = await trip(ids.a, dest.id, `current_date`, `current_date + 2`, 'hidden');
    await trip(ids.b, dest.id, `current_date`, `current_date + 5`);
    await asRole('authenticated', ids.a);
    const thisWeek = await overlapFor('a', week, `false, true`);
    if (listNames(thisWeek) !== 'Ben') throw new Error(`this week: ${listNames(thisWeek)}`);
    const farTrip = await overlapFor('a', annTrip, `false, true`);
    if (farTrip.rowCount !== 0) throw new Error(`a trip ten days away matched this week: ${listNames(farTrip)}`);
  });
  await check('name search matches names only, with no wildcards', 'ok', async () => {
    await asRole('authenticated', ids.a);
    const byName = await overlapFor('a', annTrip, `false, false, 'fin'`);
    if (listNames(byName) !== 'Finn') throw new Error(`got ${listNames(byName)}`);
    for (const q of ['zzz', '%', '_', '.*']) {
      const r = await overlapFor('a', annTrip, `false, false, '${q}'`);
      if (r.rowCount !== 0) throw new Error(`query ${q} matched ${r.rowCount}`);
    }
  });
  await check('the caller\'s date is clamped to within a day of the server\'s', 'ok', async () => {
    await asRole('authenticated', ids.a);
    // A date far in the future would hide the trip as "ended" if it were trusted.
    const r = await overlapFor('a', annTrip, `false, false, null, current_date + 3650, 50, 0`);
    if (r.rowCount !== 4) throw new Error(`expected 4 rows, got ${r.rowCount}`);
  });
  await check('overlap caps results at 50 per call and nothing from offset 100', 'ok', async () => {
    await client.query(
      `insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
       select gen_random_uuid(), 'trip' || g || '@rls-test.invalid', now(), '{"terms_accepted":"true","age_confirmed":"true"}'
       from generate_series(1, 120) g`);
    await client.query(
      `insert into public.profiles (id, display_name, home_destination_id, discoverable_at)
       select id, 'Trip Bulk', $1, now() from auth.users where email like 'trip%@rls-test.invalid'`, [dest.id]);
    await client.query(`insert into public.profile_sports (profile_id, skill_tier) select id, 'Beginner' from public.profiles where display_name = 'Trip Bulk'`);
    await client.query(
      `insert into public.trips (profile_id, destination_id, start_date, end_date, visibility)
       select id, '${dest.id}', ${base}, ${base} + 7, 'members' from public.profiles where display_name = 'Trip Bulk'`);
    await asRole('authenticated', ids.a);
    const first = await overlapFor('a', annTrip, `false, false, null, current_date, 1000, 0`);
    const second = await overlapFor('a', annTrip, `false, false, null, current_date, 50, 50`);
    const beyond = await overlapFor('a', annTrip, `false, false, null, current_date, 50, 100`);
    const negative = await overlapFor('a', annTrip, `false, false, null, current_date, -5, 0`);
    if (first.rowCount !== 50) throw new Error(`first page ${first.rowCount}`);
    if (Number(first.rows[0].total_count) < 120) throw new Error(`total_count ${first.rows[0].total_count}`);
    if (second.rowCount !== 50) throw new Error(`second page ${second.rowCount}`);
    if (beyond.rowCount !== 0) throw new Error(`offset 100 returned ${beyond.rowCount}`);
    if (negative.rowCount !== 0) throw new Error(`negative limit returned ${negative.rowCount}`);
  });


  // --- join requests ---
  const jo = '00000000-0000-4000-8000-000000000005'; // verified, Intermediate, "Jordi Martí"
  const kai = '00000000-0000-4000-8000-000000000006'; // verified, Beginner
  const lou = '00000000-0000-4000-8000-000000000007'; // verified, Advanced
  for (const [id, name, tier] of [[jo, 'Jordi Martí', 'Intermediate'], [kai, 'Kai', 'Beginner'], [lou, 'Lou', 'Advanced']]) {
    await user(id, true);
    await client.query(`insert into public.profiles (id, display_name) values ($1, $2)`, [id, name]);
    await client.query(`insert into public.profile_sports (profile_id, skill_tier) values ($1, $2)`, [id, tier]);
  }
  const rpc = async (userId, fn, ...args) => {
    await asRole('authenticated', userId);
    return client.query(`select * from public.${fn}(${args.map((_, i) => `$${i + 1}`).join(', ')})`, args);
  };
  // Fixture reads run as the database owner, whatever role the previous step left behind.
  const reqStatus = async (listingId, profileId) =>
    (await client.query('reset role'), await client.query(`select status from public.join_requests where listing_id = $1 and profile_id = $2`, [listingId, profileId])).rows[0]?.status;
  const requestId = async (listingId, profileId) =>
    (await client.query('reset role'), await client.query(`select id from public.join_requests where listing_id = $1 and profile_id = $2`, [listingId, profileId])).rows[0].id;
  const spotsLeft = async (listingId) =>
    (await client.query(`select spots_left from public.discover_listings where id = $1`, [listingId])).rows[0]?.spots_left;

  await check('anon cannot read join requests', 'deny', async () => {
    await asRole('anon');
    return client.query('select * from public.join_requests');
  });
  await check('anon cannot call request_to_join, withdraw, decide or match_people', 'ok', async () => {
    const r = await client.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
       where p.proname in ('request_to_join', 'withdraw_join_request', 'decide_join_request', 'match_people', 'public_name_of', 'reject_players_below_accepted')
         and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('public', p.oid, 'EXECUTE'))`);
    if (r.rowCount !== 0) throw new Error(`anon can execute: ${r.rows.map((x) => x.proname).join(', ')}`);
  });
  await check('signed-in users can execute the four functions and not the helpers', 'ok', async () => {
    const r = await client.query(
      `select p.proname, has_function_privilege('authenticated', p.oid, 'EXECUTE') as can
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
       where p.proname in ('request_to_join', 'withdraw_join_request', 'decide_join_request', 'match_people', 'public_name_of', 'reject_players_below_accepted')`);
    const can = r.rows.filter((x) => x.can).map((x) => x.proname).sort().join(',');
    if (can !== 'decide_join_request,match_people,request_to_join,withdraw_join_request') throw new Error(`authenticated can execute: ${can}`);
  });
  await check('signed-in users hold only select on join_requests', 'ok', async () => {
    const r = await client.query(
      `select p.privilege from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')) as p(privilege)
       where has_table_privilege('authenticated', 'public.join_requests', p.privilege)`);
    if (r.rows.map((x) => x.privilege).join(',') !== 'SELECT') throw new Error(`privileges: ${r.rows.map((x) => x.privilege)}`);
  });

  await check('a verified member requests a place and sees only their own row', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await asRole('authenticated', ids.b);
    expectRows(1)(await client.query('select * from public.join_requests'));
    if ((await reqStatus(aListing.id, ids.b)) !== 'pending') throw new Error('not pending');
  });
  await check("another member cannot read someone else's request", 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await asRole('authenticated', ids.d);
    expectRows(0)(await client.query('select * from public.join_requests'));
  });
  for (const sql of [
    `insert into public.join_requests (listing_id, profile_id) values ('${aListing.id}', '${ids.b}')`,
    `update public.join_requests set status = 'accepted'`,
    `delete from public.join_requests`,
  ]) {
    await check(`direct write rejected: ${sql.split(' ').slice(0, 3).join(' ')}`, 'deny', async () => {
      await rpc(ids.b, 'request_to_join', aListing.id);
      await asRole('authenticated', ids.b);
      return client.query(sql);
    });
  }

  await checkCode('the organiser cannot request their own match', 'own_match', () => rpc(ids.a, 'request_to_join', aListing.id));
  await checkCode('an unverified email cannot request', 'email_not_confirmed', () => rpc(ids.c, 'request_to_join', aListing.id));
  await checkCode('an unknown match is not found', 'not_found', () => rpc(ids.b, 'request_to_join', '00000000-0000-4000-8000-0000000000ff'));
  await checkCode('a second request is refused', 'already_requested', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.b, 'request_to_join', aListing.id);
  });
  await checkCode('a closed match takes no request', 'match_closed', async () => {
    await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]);
    await rpc(ids.b, 'request_to_join', aListing.id);
  });
  await checkCode('a past match takes no request', 'match_past', async () => {
    await client.query('reset role');
    await client.query(`alter table public.listings disable trigger listings_reject_past_start_date`);
    await client.query(`update public.listings set start_date = current_date - 3, end_date = current_date - 2 where id = $1`, [aListing.id]);
    await rpc(ids.b, 'request_to_join', aListing.id);
  });

  await checkCode('only the organiser can decide', 'not_organiser', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.d, 'decide_join_request', await requestId(aListing.id, ids.b), true);
  });
  await checkCode('the requester cannot accept their own request', 'not_organiser', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.b, 'decide_join_request', await requestId(aListing.id, ids.b), true);
  });
  await check('the organiser accepts, the place is taken and the people function shows it', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
    if ((await reqStatus(aListing.id, ids.b)) !== 'accepted') throw new Error('not accepted');
    if ((await spotsLeft(aListing.id)) !== 1) throw new Error(`spots_left ${await spotsLeft(aListing.id)}`);
  });
  await checkCode('a decided request cannot be decided again', 'not_pending', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    const id = await requestId(aListing.id, ids.b);
    await rpc(ids.a, 'decide_join_request', id, true);
    await rpc(ids.a, 'decide_join_request', id, false);
  });
  await checkCode('a closed match cannot have requests decided', 'match_closed', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await client.query('reset role');
    await client.query(`update public.listings set status = 'closed' where id = $1`, [aListing.id]);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
  });

  const fillMatch = async () => {
    for (const who of [ids.b, jo]) {
      await rpc(who, 'request_to_join', aListing.id);
      await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, who), true);
    }
  };
  await checkCode('a third accept is refused when both places are taken', 'match_full', async () => {
    await fillMatch();
    await client.query('reset role');
    await client.query(`delete from public.join_requests where listing_id = $1 and profile_id = $2`, [aListing.id, kai]);
    // kai asked while a place was free; the match filled afterwards
    await client.query(`insert into public.join_requests (listing_id, profile_id) values ($1, $2)`, [aListing.id, kai]);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, kai), true);
  });
  await checkCode('a full match takes no new request', 'match_full', async () => {
    await fillMatch();
    await rpc(kai, 'request_to_join', aListing.id);
  });
  await check('last place: two pending requests, one accept succeeds, the other is refused as full', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(jo, 'request_to_join', aListing.id);
    await rpc(kai, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, jo), true);
    await client.query('savepoint last');
    let refused = false;
    try {
      await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, kai), true);
    } catch (error) {
      refused = error.message === 'match_full';
      await client.query('rollback to savepoint last');
    }
    if (!refused) throw new Error('over-accepted');
    await client.query('reset role');
    const n = (await client.query(`select count(*)::int as n from public.join_requests where listing_id = $1 and status = 'accepted'`, [aListing.id])).rows[0].n;
    if (n !== 2) throw new Error(`accepted ${n}`);
  });
  await check('the organiser can still decline a request on a full match', 'ok', async () => {
    await fillMatch();
    await client.query('reset role');
    await client.query(`insert into public.join_requests (listing_id, profile_id) values ($1, $2)`, [aListing.id, kai]);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, kai), false);
    if ((await reqStatus(aListing.id, kai)) !== 'declined') throw new Error('not declined');
  });
  await check('a full match leaves the destination count but stays readable by id', 'ok', async () => {
    const before = (await client.query(`select open_listings from public.destinations_with_counts where id = $1`, [dest.id])).rows[0].open_listings;
    await fillMatch();
    await asRole('anon');
    const after = (await client.query(`select open_listings from public.destinations_with_counts where id = $1`, [dest.id])).rows[0].open_listings;
    if (after !== before - 1) throw new Error(`count ${before} -> ${after}`);
    const row = await client.query(`select spots_left from public.discover_listings where id = $1`, [aListing.id]);
    if (row.rowCount !== 1 || row.rows[0].spots_left !== 0) throw new Error('full match not readable with 0 spots');
  });
  await check('a withdrawal frees the place and the match returns to the count', 'ok', async () => {
    await fillMatch();
    await rpc(ids.b, 'withdraw_join_request', aListing.id);
    if ((await reqStatus(aListing.id, ids.b)) !== 'withdrawn') throw new Error('not withdrawn');
    if ((await spotsLeft(aListing.id)) !== 1) throw new Error(`spots_left ${await spotsLeft(aListing.id)}`);
  });

  await checkCode('a declined member cannot ask again', 'declined', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), false);
    await rpc(ids.b, 'request_to_join', aListing.id);
  });
  await check('a withdrawn member can ask again', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.b, 'withdraw_join_request', aListing.id);
    await rpc(ids.b, 'request_to_join', aListing.id);
    if ((await reqStatus(aListing.id, ids.b)) !== 'pending') throw new Error('not pending again');
  });
  await checkCode('withdrawing with no request is not found', 'not_found', () => rpc(ids.d, 'withdraw_join_request', aListing.id));
  await checkCode('withdrawing twice is refused', 'not_pending', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.b, 'withdraw_join_request', aListing.id);
    await rpc(ids.b, 'withdraw_join_request', aListing.id);
  });
  await checkCode('an accepted player cannot withdraw once the match has started', 'match_past', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
    await client.query('reset role');
    await client.query(`alter table public.listings disable trigger listings_reject_past_start_date`);
    await client.query(`update public.listings set start_date = current_date - 1, end_date = current_date + 5 where id = $1`, [aListing.id]);
    await rpc(ids.b, 'withdraw_join_request', aListing.id);
  });

  await checkCode('players needed cannot drop below the accepted players', 'players_below_accepted', async () => {
    await fillMatch();
    await asRole('authenticated', ids.a);
    await client.query(`update public.listings set players_needed = 1 where id = $1`, [aListing.id]);
  });
  await check('players needed can go up, and down to the accepted count', 'ok', async () => {
    await fillMatch();
    await asRole('authenticated', ids.a);
    await client.query(`update public.listings set players_needed = 3 where id = $1`, [aListing.id]);
    await client.query(`update public.listings set players_needed = 2 where id = $1`, [aListing.id]);
  });

  await check('match_people returns exactly the permitted columns and no email or id of a person', 'ok', async () => {
    const r = await rpc(ids.b, 'match_people', aListing.id);
    const got = r.fields.map((f) => f.name).sort().join(',');
    const want = 'accepted_count,own_status,pending_count,person_kind,person_name,players_needed,request_id,request_status,skill_tier,viewer_role';
    if (got !== want) throw new Error(`columns differ: ${got}`);
  });
  await check('anon cannot call match_people', 'deny', async () => {
    await asRole('anon');
    return client.query('select * from public.match_people($1)', [aListing.id]);
  });
  await check('match_people for the organiser: role, pending count, requests and first name plus initial', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(jo, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
    const r = await rpc(ids.a, 'match_people', aListing.id);
    const first = r.rows[0];
    if (first.viewer_role !== 'organiser' || first.pending_count !== 1 || first.accepted_count !== 1) throw new Error(JSON.stringify(first));
    const kinds = r.rows.map((x) => x.person_kind).join(',');
    if (kinds !== 'organiser,player,request') throw new Error(`kinds ${kinds}`);
    const request = r.rows.find((x) => x.person_kind === 'request');
    if (request.person_name !== 'Jordi M.' || request.skill_tier !== 'Intermediate' || !request.request_id) throw new Error(JSON.stringify(request));
  });
  await check('match_people for another member shows organiser and accepted players, never a pending request', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(jo, 'request_to_join', aListing.id);
    await rpc(ids.a, 'decide_join_request', await requestId(aListing.id, ids.b), true);
    const r = await rpc(ids.d, 'match_people', aListing.id);
    if (r.rows[0].viewer_role !== 'member' || r.rows[0].own_status !== null || r.rows[0].pending_count !== null) throw new Error(JSON.stringify(r.rows[0]));
    if (r.rows.map((x) => x.person_kind).join(',') !== 'organiser,player') throw new Error('wrong people');
    if (r.rows.some((x) => x.request_id !== null)) throw new Error('request id exposed');
  });
  await check('match_people tells a requester their own status and nothing about other requests', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await rpc(jo, 'request_to_join', aListing.id);
    const r = await rpc(ids.b, 'match_people', aListing.id);
    if (r.rows[0].viewer_role !== 'requester' || r.rows[0].own_status !== 'pending') throw new Error(JSON.stringify(r.rows[0]));
    if (r.rows.some((x) => x.person_kind === 'request')) throw new Error('request exposed');
  });
  await check('match_people for an unknown match returns nothing', 'ok', async () => {
    expectRows(0)(await rpc(ids.b, 'match_people', '00000000-0000-4000-8000-0000000000ff'));
  });
  await check('deleting a listing removes its requests', 'ok', async () => {
    await rpc(ids.b, 'request_to_join', aListing.id);
    await client.query('reset role');
    await client.query(`delete from public.listings where id = $1`, [aListing.id]);
    expectRows(0)(await client.query(`select 1 from public.join_requests where listing_id = $1`, [aListing.id]));
  });

  // --- no sensitive columns exposed ---
  await check('views and profiles expose no email or consent columns', 'ok', async () => {
    const r = await client.query(
      `select table_name, column_name from information_schema.columns
       where table_schema = 'public'
         and table_name in ('discover_listings', 'destinations_with_counts', 'profiles', 'listings')
         and (column_name ilike '%email%' or column_name ilike '%consent%'
              or column_name in ('terms_accepted_at', 'age_confirmed_at'))`);
    if (r.rowCount > 0) throw new Error(r.rows.map((x) => `${x.table_name}.${x.column_name}`).join(', '));
  });

  await client.query('rollback');
  await client.end();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error('Test run failed:', error.message);
  try { await client.query('rollback'); await client.end(); } catch {}
  process.exit(2);
});
