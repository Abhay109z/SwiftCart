import { mockDarkStores } from '../data/darkStores.js';
import { mockRiders } from '../data/riders.js';
import { DarkStore, Rider, SurgeZone } from '../types.js';

class GeospatialEngine {
  // Haversine formula (Simulates PostgreSQL PostGIS: ST_Distance(user_geo, store_geo))
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Find nearest dark store within coverage radius
  public findNearestDarkStore(userLat: number, userLng: number): {
    store: DarkStore;
    distanceKm: number;
    estimatedMinutes: number;
    isDeliverable: boolean;
  } {
    let nearest: DarkStore = mockDarkStores[0];
    let minDistance = Infinity;

    for (const store of mockDarkStores) {
      const dist = this.calculateDistanceKm(userLat, userLng, store.lat, store.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = store;
      }
    }

    // Quick-commerce delivery time formula: 3 min packing + (distanceKm * 2.5 min travel)
    const estimatedMinutes = Math.max(7, Math.min(12, Math.round(3 + minDistance * 2.5)));
    const isDeliverable = minDistance <= (nearest.coverageRadiusKm || 3.5);

    return {
      store: nearest,
      distanceKm: minDistance,
      estimatedMinutes,
      isDeliverable
    };
  }

  // Dispatch nearest available delivery partner (Simulating Redis GeoRadius / PostGIS query)
  public findNearestRider(storeLat: number, storeLng: number): Rider {
    let nearestRider: Rider = mockRiders[0];
    let minDist = Infinity;

    for (const rider of mockRiders) {
      const dist = this.calculateDistanceKm(storeLat, storeLng, rider.lat, rider.lng);
      if (dist < minDist) {
        minDist = dist;
        nearestRider = rider;
      }
    }

    return { ...nearestRider, status: 'assigned' };
  }

  // Dynamic Surge Pricing by Geohash zones
  public calculateSurgeZones(): SurgeZone[] {
    const zones: SurgeZone[] = [
      {
        geohash: 'tdr1v7',
        zoneName: 'Koramangala 4th & 5th Block',
        centerLat: 12.9352,
        centerLng: 77.6245,
        activeOrders: 42,
        availableRiders: 18,
        demandRatio: 2.33,
        surgeMultiplier: 1.15,
        surgeFee: 15,
        color: '#f59e0b'
      },
      {
        geohash: 'tdr1y4',
        zoneName: 'Indiranagar 100ft Metro Corridor',
        centerLat: 12.9719,
        centerLng: 77.6412,
        activeOrders: 68,
        availableRiders: 21,
        demandRatio: 3.24,
        surgeMultiplier: 1.35,
        surgeFee: 30,
        color: '#ef4444' // High surge zone
      },
      {
        geohash: 'tdr1t8',
        zoneName: 'HSR Layout Sectors 1-3',
        centerLat: 12.9121,
        centerLng: 77.6446,
        activeOrders: 28,
        availableRiders: 25,
        demandRatio: 1.12,
        surgeMultiplier: 1.0,
        surgeFee: 0,
        color: '#10b981' // Normal, no surge
      },
      {
        geohash: 'tdr1wu',
        zoneName: 'Bellandur Tech Park Zone',
        centerLat: 12.9260,
        centerLng: 77.6762,
        activeOrders: 51,
        availableRiders: 20,
        demandRatio: 2.55,
        surgeMultiplier: 1.25,
        surgeFee: 20,
        color: '#f97316'
      }
    ];

    return zones;
  }

  // Calculate live rider GPS position along route based on elapsed delivery seconds
  public interpolateRiderPosition(
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number,
    progressFraction: number // 0.0 to 1.0
  ): { lat: number; lng: number; remainingMeters: number } {
    const clampedProgress = Math.max(0, Math.min(1, progressFraction));

    // Add slight realistic road turn curvature to straight line
    const lateralJitter = Math.sin(clampedProgress * Math.PI) * 0.0012;

    const lat = startLat + (destLat - startLat) * clampedProgress + lateralJitter * 0.5;
    const lng = startLng + (destLng - startLng) * clampedProgress + lateralJitter;

    const remainingDistanceKm = this.calculateDistanceKm(lat, lng, destLat, destLng);
    const remainingMeters = Math.round(remainingDistanceKm * 1000);

    return {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      remainingMeters
    };
  }
}

export const geospatialEngine = new GeospatialEngine();
