require('ts-node/register');

module.exports = {
  development: {
    client: 'pg',
    // Use DATABASE_URL from environment or fallback to local database. See lib/db.ts for connection details.
    connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/console_db',
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};