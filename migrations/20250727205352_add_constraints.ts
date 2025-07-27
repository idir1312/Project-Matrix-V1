import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.text('code').unique().alter();
  });
  // await knex.raw("SELECT create_hypertable('economy_gdp', 'ts', if_not_exists => TRUE);");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('regions', (table) => {
    table.dropUnique([], 'regions_code_unique');
  });
  // Hypertable cannot be easily dropped, ignoring for down
}
