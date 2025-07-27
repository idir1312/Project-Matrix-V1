import { Pool } from 'pg';

/*
 * Centralized database connection pool. The connection string is read from
 * the DATABASE_URL environment variable. When not set, it falls back to
 * a local Postgres instance. The pool is reused across API route
 * invocations to avoid exhausting database connections. See the
 * README for details on configuring the database.
 */
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/console_db',
});

export default pool;