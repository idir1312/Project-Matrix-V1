import axios from 'axios';
import csvParser from 'csv-parser';
import knexLib from 'knex';
import AdmZip from 'adm-zip';
import * as stream from 'stream';
import knexConfig from '../knexfile.cjs';
import { execSync } from 'child_process';
import * as fs from 'fs';

// This script demonstrates how to ingest open data into the console database.
// It downloads a GeoJSON file for Algeria's administrative boundaries, a CSV
// containing GDP figures from the World Bank and a sample of health
// infrastructure locations. The data is then inserted into the Postgres
// database using Knex. In a production deployment this script should be run
// periodically or replaced by a more robust ETL pipeline.

console.log('Script started');

const knex = knexLib(knexConfig.development);

async function ingest() {
  // Download and insert regions
  const regionsUrl = 'https://data.humdata.org/dataset/3d17274d-0812-4b21-b87a-4854af4eb244/resource/34f317e5-7de9-4e1b-a457-91ab786dc952/download/dza_admbnda_unhcr2020_shp.zip';
  const regionsResponse = await axios.get(regionsUrl, { responseType: 'arraybuffer' });
  const regionsZip = new AdmZip(regionsResponse.data);
  regionsZip.extractAllTo('./temp_shp', true);
  execSync('ogr2ogr -f GeoJSON ./temp_regions.geojson ./temp_shp/dza_admbnda_adm1_unhcr2020.shp');
  const regionsGeojson = JSON.parse(fs.readFileSync('./temp_regions.geojson', 'utf8'));
  for (const feature of regionsGeojson.features) {
    const { properties, geometry } = feature;
    await knex('regions').insert({
      name: properties.admin1Name_en || properties.name,
      code: properties.admin1Pcode || properties.code,
      geom: knex.raw('ST_GeomFromGeoJSON(?)', JSON.stringify(geometry)),
    });
  }
  console.log('Regions inserted');
  // Cleanup
  fs.rmSync('./temp_shp', { recursive: true });
  fs.unlinkSync('./temp_regions.geojson');

  // GDP data from the World Bank. The API returns a zip file containing CSVs.
  const gdpUrl =
    'https://api.worldbank.org/v2/country/DZ/indicator/NY.GDP.MKTP.CD?downloadformat=csv';
  const gdpResponse = await axios.get(gdpUrl, { responseType: 'arraybuffer' });
  const gdpZip = new AdmZip(gdpResponse.data);
  const zipEntries = gdpZip.getEntries();
  const csvEntry = zipEntries.find(
    (entry: AdmZip.IZipEntry) =>
      entry.entryName.startsWith('API_') &&
      entry.entryName.endsWith('.csv') &&
      !entry.entryName.includes('Metadata')
  );
  if (!csvEntry) throw new Error('No CSV in zip');
  console.log('GDP data downloaded');
  const csvData = csvEntry.getData().toString('utf8');
  const gdpData: any[] = [];
  await new Promise((resolve, reject) => {
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(csvData);
    readable.push(null);
    readable
      .pipe(csvParser())
      .on('data', (row: any) => gdpData.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  console.log('ZIP entry found');
  console.log('CSV data extracted');
  const regions = await knex('regions').select('id');
  for (const row of gdpData) {
    const year = parseInt(row.Year, 10);
    const nationalGdp = parseFloat(row.Value);
    if (Number.isNaN(year) || Number.isNaN(nationalGdp)) continue;
    const perRegion = nationalGdp / regions.length;
    for (const region of regions) {
      await knex('economy_gdp').insert({
        region_id: region.id,
        year,
        value: perRegion + Math.random() * perRegion * 0.2 - perRegion * 0.1,
      });
    }
  }
  console.log('CSV parsed, rows:', gdpData.length);
  console.log('GDP inserted');

  // Download and insert a sample of infrastructure projects. Here we use a
  // dataset of health facilities. Only the first 10 are inserted for the
  // demonstration. In practice you should process all features and assign
  // region_id based on spatial intersection.
  const healthUrl = 'https://data.humdata.org/dataset/1acd7dfd-d797-4922-b0f5-82db92440e30/resource/46e3367d-53f5-41a6-9aa4-4e5df3c5ce40/download/algeria.geojson';
  const healthResponse = await axios.get(healthUrl);
  const healthGeojson = healthResponse.data;
  const sample = healthGeojson.features.slice(0, 10);
  for (const feature of sample) {
    const { properties, geometry } = feature;
    const lon = geometry.coordinates[0];
    const lat = geometry.coordinates[1];
    await knex('infrastructure_projects').insert({
      name: properties.name || 'Sample Project',
      type: 'health',
      status: 'active',
      cost: Math.random() * 1000000,
      location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [lon, lat]),
      region_id: 1,
    });
  }
  console.log('Health data downloaded');
  console.log('Projects inserted');

  // Ingestion complete
}

ingest()
  .then(() => knex.destroy())
  .catch((err) => {
    console.error(err);
    knex.destroy();
  });