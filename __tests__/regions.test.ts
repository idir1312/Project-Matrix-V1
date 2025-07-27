import { GET } from '../app/api/regions/geojson/route';

describe('Regions API', () => {
  test('returns 58 features', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.features.length).toBe(58);
  });
}); 