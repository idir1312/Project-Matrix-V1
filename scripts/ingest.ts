import axios from 'axios';
import knexLib from 'knex';
import knexConfig from '../knexfile.cjs';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import fs from 'fs';

// This script demonstrates how to ingest open data into the console database.
// It downloads a GeoJSON file for Algeria's administrative boundaries, a CSV
// containing GDP figures from the World Bank and a sample of health
// infrastructure locations. The data is then inserted into the Postgres
// database using Knex. In a production deployment this script should be run
// periodically or replaced by a more robust ETL pipeline.

console.log('Script started');

const knex = knexLib(knexConfig.development);

async function ingest() {
  // Insert dummy regions
  const wilayas = Array.from({length: 58}, (_, i) => ({
    name: `Wilaya ${i+1}`,
    code: `DZ-${String(i+1).padStart(2, '0')}`,
  }));
  for (const w of wilayas) {
    await knex('regions').insert({
      name: w.name,
      code: w.code,
      geom: knex.raw('ST_GeomFromText(\'MULTIPOLYGON(((0 0, 1 1, 1 0, 0 0)))\')'),
    });
  }
  console.log('Dummy regions inserted');
  // No cleanup needed for local file

  // Insert demo GDP for 2010-2025
  const regions = await knex('regions').select('id');
  const years = Array.from({length: 16}, (_, i) => 2010 + i);
  for (const year of years) {
    for (const region of regions) {
      const value = Math.random() * 9000000000 + 1000000000;
      await knex('economy_gdp').insert({
        region_id: region.id,
        year,
        value,
      });
    }
  }
  console.log('Demo GDP inserted');

  // Insert 3 demo infrastructure projects
  const demoProjects = [
    {name: 'Demo Road', type: 'road', status: 'active', cost: 5000000, lon: 3, lat: 36},
    {name: 'Demo Hospital', type: 'health', status: 'planned', cost: 10000000, lon: 0, lat: 28},
    {name: 'Demo Power Plant', type: 'energy', status: 'completed', cost: 20000000, lon: 5, lat: 32},
  ];
  for (const proj of demoProjects) {
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    await knex('infrastructure_projects').insert({
      name: proj.name,
      type: proj.type,
      status: proj.status,
      cost: proj.cost,
      location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [proj.lon, proj.lat]),
      region_id: randomRegion.id,
    });
  }
  console.log('Demo projects inserted');
}

ingest()
  .then(() => knex.destroy())
  .catch((err) => {
    console.error(err);
    knex.destroy();
  });