// Simple migration runner using node-postgres
// Usage: DATABASE_URL=postgres://... node scripts/migrate.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Aborting migrations.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const full = path.join(migrationsDir, file);
      console.log('Running', file);
      const sql = fs.readFileSync(full, 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Applied', file);
    }

    console.log('All migrations applied');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
