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

const expectRows = (n) => async (res) => {
  if (res.rowCount !== n) throw new Error(`expected ${n} rows, got ${res.rowCount}`);
};

async function main() {
  await client.connect();
  await client.query('begin');

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
  for (const [name, id] of [['Ann', ids.a], ['Ben', ids.b], ['Cat', ids.c]]) {
    await client.query(`insert into public.profiles (id, display_name) values ($1, $2)`, [id, name]);
    await client.query(`insert into public.profile_sports (profile_id, skill_tier) values ($1, 'Intermediate')`, [id]);
  }
  const { rows: [dest] } = await client.query(`select id from public.destinations where name = 'Marbella'`);
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
      'poster_name', 'poster_skill_tier',
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
