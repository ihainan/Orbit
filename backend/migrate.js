import 'dotenv/config';
import { runner } from 'node-pg-migrate';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

await runner({
  databaseUrl: `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  migrationsTable: 'pgmigrations',
  dir: 'migrations',
  direction: 'up',
  log: console.log,
});
