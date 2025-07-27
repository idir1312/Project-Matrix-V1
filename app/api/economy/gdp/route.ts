import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/*
 * API handler for GDP data by region and year.
 *
 * This endpoint accepts an optional `year` query parameter and returns
 * the gross domestic product for each region for that year. The response
 * includes the region's id, name, code, year and value. When no year is
 * provided the API selects the most recent year present in the table.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    let year: number | null = null;
    if (yearParam) {
      const parsed = parseInt(yearParam, 10);
      year = Number.isNaN(parsed) ? null : parsed;
    }
    // Determine the target year. If none is supplied or invalid, pick
    // the maximum year available in the table.
    if (year === null) {
      const maxRes = await pool.query('SELECT MAX(year) as year FROM economy_gdp');
      year = maxRes.rows[0]?.year ?? null;
    }
    if (year === null) {
      return new NextResponse('No GDP data available', { status: 404 });
    }
    const result = await pool.query(
      `SELECT r.id, r.name, r.code, e.year, e.value
       FROM economy_gdp e
       JOIN regions r ON e.region_id = r.id
       WHERE e.year = $1
       ORDER BY r.id`,
      [year]
    );
    return NextResponse.json({ year, data: result.rows });
  } catch (err) {
    console.error('Error fetching GDP:', err);
    return new NextResponse('Failed to load GDP data', { status: 500 });
  }
}