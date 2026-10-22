import { calculateDistanceKm, findNearbyHospitals } from '../src/services/hospitalService.js';

describe('Hospital Discovery & Geolocation Calculation Unit Tests', () => {
  test('calculateDistanceKm should calculate zero distance for identical coordinates', () => {
    const dist = calculateDistanceKm(26.2183, 78.1828, 26.2183, 78.1828);
    expect(dist).toBe(0);
  });

  test('calculateDistanceKm should accurately compute distance between known landmarks', () => {
    // MITS Gwalior (26.2183, 78.1828) to Gwalior Railway Station (26.2238, 78.1844) ~ 0.6 km
    const dist = calculateDistanceKm(26.2183, 78.1828, 26.2238, 78.1844);
    expect(dist).toBeGreaterThan(0.4);
    expect(dist).toBeLessThan(1.5);
  });

  test('calculateDistanceKm should calculate long-range distance between Gwalior and Delhi AIIMS (~270km)', () => {
    // Gwalior to AIIMS Delhi (28.5672, 77.2100)
    const dist = calculateDistanceKm(26.2183, 78.1828, 28.5672, 77.2100);
    expect(dist).toBeGreaterThan(250);
    expect(dist).toBeLessThan(300);
  });

  test('findNearbyHospitals should return facilities ordered by distance', async () => {
    const facilities = await findNearbyHospitals(26.2183, 78.1828, 5000);
    expect(Array.isArray(facilities)).toBe(true);
    expect(facilities.length).toBeGreaterThan(0);

    // Verify sorted ascending
    for (let i = 1; i < facilities.length; i++) {
      expect(facilities[i].distanceKm).toBeGreaterThanOrEqual(facilities[i - 1].distanceKm);
    }

    // Verify structure
    const first = facilities[0];
    expect(first.name).toBeDefined();
    expect(first.latitude).toBeDefined();
    expect(first.longitude).toBeDefined();
    expect(first.navigationUrl).toContain('google.com/maps');
  });
});
