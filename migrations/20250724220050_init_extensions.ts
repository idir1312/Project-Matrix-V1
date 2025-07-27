import { Knex } from 'knex';

// Enable PostGIS and TimescaleDB extensions. These extensions provide geospatial
// and time‑series capabilities for the database. Without them the migrations
// below will fail to create the geometry and hypertable columns.
export async function up(knex: Knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis;');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS timescaledb;');
}

export async function down(knex: Knex) {
  await knex.raw('DROP EXTENSION IF EXISTS postgis;');
  await knex.raw('DROP EXTENSION IF EXISTS timescaledb;');
}