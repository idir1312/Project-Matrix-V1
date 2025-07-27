import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/*
 * API handler for administrative regions.
 *
 * This endpoint returns a GeoJSON FeatureCollection representing Algeria's
 * first‑level administrative units (wilayas). Each feature contains
 * properties for the region identifier, name and code, and the geometry
 * coordinates are encoded as GeoJSON MultiPolygons. The response is
 * dynamically generated on every request to reflect any updates in the
 * underlying PostGIS table.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query all regions and convert the geometry to GeoJSON on the fly.
    const result = await pool.query(
      `SELECT id, name, code, ST_AsGeoJSON(geom) AS geometry FROM regions`
    );
    const features = result.rows.map((row) => ({
      type: 'Feature',
      properties: {
        id: row.id,
        name: row.name,
        code: row.code,
      },
      geometry: JSON.parse(row.geometry),
    }));
    const geojson = {
      type: 'FeatureCollection',
      features,
    };
    return NextResponse.json(geojson);
  } catch (err) {
    console.error('Error fetching regions:', err);
    return new NextResponse('Failed to load regions', { status: 500 });
  }
}