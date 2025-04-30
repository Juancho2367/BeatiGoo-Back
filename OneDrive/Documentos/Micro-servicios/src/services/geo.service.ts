import { FastifyError } from 'fastify';
import {
  GeoPoint,
  GeocodingResponse,
  ReverseGeocodingResponse,
  DistanceResponse,
  NearbySearchResponse
} from '../schemas/geo.schema';
import { NearbyPoint } from '../types/geo.types';

export class GeoError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'GEO_SERVICE_ERROR';
  }
}

export class GeoService {
  private readonly earthRadiusKm = 6371; // Earth's radius in kilometers

  async geocode(address: string): Promise<GeocodingResponse> {
    try {
      // TODO: Implement actual geocoding using a service like Google Maps, Mapbox, etc.
      // This is a mock implementation
      return {
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        formattedAddress: "New York, NY, USA",
        confidence: 0.9
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new GeoError(`Geocoding failed: ${message}`);
    }
  }

  async reverseGeocode(location: GeoPoint): Promise<ReverseGeocodingResponse> {
    try {
      // TODO: Implement actual reverse geocoding
      // This is a mock implementation
      return {
        address: "350 5th Ave",
        formattedAddress: "350 5th Ave, New York, NY 10118, USA",
        components: {
          street: "5th Ave",
          city: "New York",
          state: "NY",
          country: "USA",
          postalCode: "10118"
        }
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new GeoError(`Reverse geocoding failed: ${message}`);
    }
  }

  calculateDistance(origin: GeoPoint, destination: GeoPoint): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(destination.latitude - origin.latitude);
    const dLon = this.toRad(destination.longitude - origin.longitude);
    const lat1 = this.toRad(origin.latitude);
    const lat2 = this.toRad(destination.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async findNearbyPoints(center: GeoPoint, radius: number, points: GeoPoint[]): Promise<{ points: NearbyPoint[] }> {
    const nearbyPoints = points
      .map(point => ({
        point,
        distance: this.calculateDistance(center, point)
      }))
      .filter(point => point.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return { points: nearbyPoints };
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export function createGeoService(): GeoService {
  return new GeoService();
} 