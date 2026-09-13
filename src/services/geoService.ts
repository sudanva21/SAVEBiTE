// ==============================================
// SaveByte — Geospatial Distance & Routing Service (Phase 4)
// ==============================================

export interface GeoCoordinate {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
}

export interface DistanceCalculationResult {
  distanceKm: number;
  estimatedMinutes: number;
  provider: string;
  isSimulated: boolean;
}

export interface GeoDistanceProvider {
  calculateDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate
  ): Promise<DistanceCalculationResult>;
}

/**
 * Deterministic fallback city coordinates (India metropolitan centers)
 */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
};

/**
 * Default Haversine Spherical Distance Engine.
 * Calculates great-circle distance and estimates urban transit time.
 */
export class HaversineDistanceProvider implements GeoDistanceProvider {
  async calculateDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate
  ): Promise<DistanceCalculationResult> {
    const origCoords = this.resolveCoordinates(origin);
    const destCoords = this.resolveCoordinates(destination);

    // If coordinates cannot be resolved at all, return conservative default
    if (!origCoords || !destCoords) {
      return {
        distanceKm: 5.0,
        estimatedMinutes: 20,
        provider: 'HAVERSINE_DEFAULT_ESTIMATE',
        isSimulated: true,
      };
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(destCoords.lat - origCoords.lat);
    const dLon = this.deg2rad(destCoords.lng - origCoords.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(origCoords.lat)) *
        Math.cos(this.deg2rad(destCoords.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const rawDistance = R * c;

    // Road network curvature factor (urban roads are ~1.25x straight-line distance)
    const roadDistanceKm = Math.max(0.2, Number((rawDistance * 1.25).toFixed(1)));

    // Urban transit calculation: average 25 km/h in Indian cities + 8 min handling buffer
    const travelTimeMinutes = Math.max(
      10,
      Math.round((roadDistanceKm / 25) * 60 + 8)
    );

    return {
      distanceKm: roadDistanceKm,
      estimatedMinutes: travelTimeMinutes,
      provider: 'HAVERSINE_SPHERICAL_ENGINE',
      isSimulated: false,
    };
  }

  private resolveCoordinates(
    coord: GeoCoordinate
  ): { lat: number; lng: number } | null {
    if (
      coord.latitude !== undefined &&
      coord.latitude !== null &&
      coord.longitude !== undefined &&
      coord.longitude !== null &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude)
    ) {
      return { lat: coord.latitude, lng: coord.longitude };
    }

    if (coord.city) {
      const cityKey = coord.city.toLowerCase().trim();
      if (CITY_COORDINATES[cityKey]) {
        // Add tiny pseudorandom offset based on address length to prevent identical points
        const offset = ((coord.address?.length || 5) % 10) * 0.002;
        return {
          lat: CITY_COORDINATES[cityKey].lat + offset,
          lng: CITY_COORDINATES[cityKey].lng + offset,
        };
      }
    }

    return null;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export singleton instance with Haversine engine default
export const geoService = new HaversineDistanceProvider();
