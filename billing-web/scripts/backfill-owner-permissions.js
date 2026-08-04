// Idempotent backfill: add the invoice-edit permissions (EDIT_TRANSACTION, REOPEN_OLD_TRANSACTION)
// to every tenant's Owner role that was created before they were added to DEFAULT_ROLE_DEFINITIONS
// (lib/tenantOnboarding.ts) during the RC-1 audit fixes. Only ever ADDS permissions — never
// removes — and is safe to re-run (skips roles that already have them).
//
// Run with: node scripts/backfill-owner-permissions.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PERMISSIONS_TO_ADD = ['EDIT_TRANSACTION', 'REOPEN_OLD_TRANSACTION'];

async function main() {
  const { rows } = await pool.query(
    `SELECT id, "tenantId", permissions FROM "Role" WHERE name = 'Owner'`
  );

  let updated = 0;
  for (const role of rows) {
    const existing = role.permissions || [];
    const missing = PERMISSIONS_TO_ADD.filter((p) => !existing.includes(p));
    if (missing.length === 0) continue;

    await pool.query(`UPDATE "Role" SET permissions = $1 WHERE id = $2`, [
      [...existing, ...missing],
      role.id,
    ]);
    updated++;
    console.log(`Owner role ${role.id} (tenant ${role.tenantId}): +${missing.join(', ')}`);
  }

  console.log(`Done. Updated ${updated} of ${rows.length} Owner role(s).`);
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  });
