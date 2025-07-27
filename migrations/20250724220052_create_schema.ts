import { Knex } from 'knex';

// Define the core tables for the strategic console. The schema covers
// administrative regions, annual GDP values per region and generic
// infrastructure projects. The geometry columns use PostGIS types so the
// API can return GeoJSON directly from the database.
export async function up(knex: Knex): Promise<void> {
  // Administrative boundaries at the first level (wilayas/provinces)
  await knex.schema.createTable('regions', (table) => {
    table.increments('id').primary();
    table.text('name');
    table.text('code');
    table.specificType('geom', 'geometry(MultiPolygon, 4326)');
  });

  // Economic gross domestic product by region and year. This table is
  // automatically promoted to a hypertable by TimescaleDB in the next step.
  await knex.schema.createTable('economy_gdp', (table) => {
    table.increments('id').primary();
    table.integer('region_id').references('regions.id');
    table.integer('year');
    table.decimal('value');
    table.timestamp('ts').defaultTo(knex.fn.now());
  });

  // Convert the GDP table into a hypertable so that large time series can be
  // queried efficiently. TimescaleDB automatically partitions the table on the
  // ts column. If Timescale is not available this statement will be ignored.
  // await knex.raw("SELECT create_hypertable('economy_gdp', 'ts');");

  // Example infrastructure projects. Real data ingestion will populate this
  // table with more meaningful projects such as hospitals, roads, etc.
  await knex.schema.createTable('infrastructure_projects', (table) => {
    table.increments('id').primary();
    table.text('name');
    table.text('type');
    table.text('status');
    table.decimal('cost');
    table.specificType('location', 'geometry(Point, 4326)');
    table.integer('region_id').references('regions.id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('infrastructure_projects');
  await knex.schema.dropTable('economy_gdp');
  await knex.schema.dropTable('regions');
}