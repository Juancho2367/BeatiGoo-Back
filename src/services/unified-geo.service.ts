import { FastifyInstance } from 'fastify';
import { GeoService } from './geo.service';
import { GeolocationService } from './geolocation.service';
import { GeoPoint, Place, NearbyPoint, BusinessWithDistance, NearbyBusinessesResponse } from '../types/geo.types';

export class UnifiedGeoService {
  private geoService: GeoService;
  private geolocationService: GeolocationService;

  constructor(fastify: FastifyInstance) {
    this.geoService = new GeoService();
    this.geolocationService = new GeolocationService(fastify);
  }

  // Métodos del GeoService (cálculos básicos)
  async calculateDistance(origin: GeoPoint, destination: GeoPoint) {
    return this.geoService.calculateDistance(origin, destination);
  }

  async findNearbyPoints(center: GeoPoint, radius: number, points: GeoPoint[]) {
    return this.geoService.findNearbyPoints(center, radius, points);
  }

  // Métodos del GeolocationService (Google Maps)
  async getPlaceDetails(placeId: string) {
    return this.geolocationService.getPlaceDetails(placeId);
  }

  async searchNearbyPlaces(params: {
    location: { lat: number; lng: number };
    radius?: number;
    type?: string;
  }) {
    return this.geolocationService.searchNearbyPlaces(params);
  }

  async geocodeAddress(address: string) {
    return this.geolocationService.geocodeAddress(address);
  }

  async getDirections(origin: string, destination: string) {
    return this.geolocationService.getDirections(origin, destination);
  }

  // Métodos combinados
  async findNearbyBusinesses(location: GeoPoint, radius: number): Promise<NearbyBusinessesResponse[]> {
    // Primero usa Google Maps para encontrar negocios
    const places = await this.searchNearbyPlaces({
      location: { lat: location.latitude, lng: location.longitude },
      radius,
      type: 'beauty_salon'
    });

    // Luego usa el servicio base para cálculos adicionales
    const points = places.map((place: Place) => ({
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    }));

    const nearbyPoints = await this.findNearbyPoints(location, radius, points);

    // Combina la información
    return places.map((place: Place) => ({
      ...place,
      distance: nearbyPoints.points.find(
        (p: NearbyPoint) => p.point.latitude === place.geometry.location.lat &&
             p.point.longitude === place.geometry.location.lng
      )?.distance
    }));
  }

  async getBusinessWithDistance(businessId: string, userLocation: GeoPoint): Promise<BusinessWithDistance> {
    // Obtiene detalles del negocio
    const business = await this.getPlaceDetails(businessId);
    
    // Calcula la distancia
    const distance = await this.calculateDistance(
      userLocation,
      {
        latitude: business.geometry.location.lat,
        longitude: business.geometry.location.lng
      }
    );

    return {
      ...business,
      distance
    };
  }
} 