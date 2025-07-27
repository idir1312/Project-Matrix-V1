import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/*
 * API handler for infrastructure projects.
 *
 * Returns a JSON array of all projects stored in the database. Each
 * project object contains its id, name, type, status, cost, associated
 * region information and a GeoJSON Point geometry representing its
 * location. Future enhancements may add filtering by region, type or
 * status via query parameters.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.type, p.status, p.cost,
              ST_AsGeoJSON(p.location) AS geometry,
              r.code as region_code
       FROM infrastructure_projects p
       JOIN regions r ON p.region_id = r.id
       ORDER BY p.id`
    );
    const features = result.rows.map((row: any) => ({
      type: 'Feature',
      properties: {
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status,
        cost: parseFloat(row.cost),
        region_code: row.region_code
      },
      geometry: JSON.parse(row.geometry)
    }));
    return NextResponse.json({
      type: 'FeatureCollection',
      features
    });
  } catch (err) {
    console.error('Error fetching infrastructure projects:', err);
    return new NextResponse('Failed to load projects', { status: 500 });
  }
}