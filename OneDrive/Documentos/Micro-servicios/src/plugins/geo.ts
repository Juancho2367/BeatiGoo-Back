import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { UnifiedGeoService } from '../services/unified-geo.service';
import { GeoPoint } from '../types/geo.types';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    geoService: UnifiedGeoService;
  }
}

const geoPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Register the unified geo service
  const geoService = new UnifiedGeoService(fastify);
  fastify.decorate('geoService', geoService);

  // Register routes
  fastify.post<{ Body: { address: string } }>('/geocode', {
    schema: {
      body: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      const { address } = request.body;
      const result = await geoService.geocodeAddress(address);
      return result;
    }
  });

  fastify.post<{ Body: { location: GeoPoint } }>('/reverse-geocode', {
    schema: {
      body: {
        type: 'object',
        required: ['location'],
        properties: {
          location: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { location } = request.body;
      const result = await geoService.geocodeAddress(
        `${location.latitude},${location.longitude}`
      );
      return result;
    }
  });

  fastify.post<{ Body: { origin: GeoPoint; destination: GeoPoint } }>('/distance', {
    schema: {
      body: {
        type: 'object',
        required: ['origin', 'destination'],
        properties: {
          origin: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          },
          destination: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { origin, destination } = request.body;
      const result = await geoService.calculateDistance(origin, destination);
      return result;
    }
  });

  fastify.post<{ Body: { center: GeoPoint; radius: number; points: GeoPoint[] } }>('/nearby', {
    schema: {
      body: {
        type: 'object',
        required: ['center', 'radius', 'points'],
        properties: {
          center: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          },
          radius: { type: 'number' },
          points: {
            type: 'array',
            items: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { center, radius, points } = request.body;
      const result = await geoService.findNearbyPoints(center, radius, points);
      return result;
    }
  });

  // Nuevas rutas para funcionalidades combinadas
  fastify.post<{ Body: { location: GeoPoint; radius: number } }>('/nearby-businesses', {
    schema: {
      body: {
        type: 'object',
        required: ['location', 'radius'],
        properties: {
          location: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          },
          radius: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      const { location, radius } = request.body;
      const result = await geoService.findNearbyBusinesses(location, radius);
      return result;
    }
  });

  fastify.get<{ 
    Params: { businessId: string };
    Querystring: { latitude: number; longitude: number };
  }>('/business/:businessId', {
    schema: {
      params: {
        type: 'object',
        required: ['businessId'],
        properties: {
          businessId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
      const { businessId } = request.params;
      const { latitude, longitude } = request.query;
      const result = await geoService.getBusinessWithDistance(
        businessId,
        { latitude, longitude }
      );
      return result;
    }
  });
};

export default fp(geoPlugin, {
  name: 'geo-plugin',
  dependencies: []
}); 