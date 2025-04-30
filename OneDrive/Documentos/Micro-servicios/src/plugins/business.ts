import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BusinessService, createBusinessService } from '../services/business.service';
import {
  BusinessSchema,
  BusinessResponseSchema
} from '../schemas/business.schema';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    businessService: BusinessService;
  }
}

const businessPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Register the business service with Fastify instance
  const businessService = createBusinessService(fastify);
  fastify.decorate('businessService', businessService);

  // Register routes
  fastify.post('/businesses', {
    schema: {
      body: BusinessSchema,
      response: {
        201: BusinessResponseSchema
      }
    },
    handler: async (request, reply) => {
      const business = await businessService.createBusiness(request.body as Static<typeof BusinessSchema>);
      return reply.code(201).send(business);
    }
  });

  fastify.get('/businesses/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: BusinessResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const business = await businessService.findBusinessById(id);
      return business;
    }
  });

  fastify.get('/businesses/owner/:ownerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          ownerId: { type: 'string' }
        },
        required: ['ownerId']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', default: 50 },
          skip: { type: 'number', default: 0 }
        }
      },
      response: {
        200: Type.Array(BusinessResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { ownerId } = request.params as { ownerId: string };
      const { status, limit, skip } = request.query as {
        status?: string[];
        limit?: number;
        skip?: number;
      };

      const businesses = await businessService.findBusinessesByOwner(ownerId, {
        status: status as any,
        limit,
        skip
      });

      return businesses;
    }
  });

  fastify.get('/businesses/nearby', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          longitude: { type: 'number' },
          latitude: { type: 'number' },
          maxDistance: { type: 'number', default: 5000 },
          category: { type: 'string' },
          status: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', default: 50 }
        },
        required: ['longitude', 'latitude']
      },
      response: {
        200: Type.Array(BusinessResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { longitude, latitude, maxDistance, category, status, limit } = request.query as {
        longitude: number;
        latitude: number;
        maxDistance?: number;
        category?: string;
        status?: string[];
        limit?: number;
      };

      const businesses = await businessService.findNearbyBusinesses(longitude, latitude, {
        maxDistance,
        category,
        status: status as any,
        limit
      });

      return businesses;
    }
  });

  fastify.patch('/businesses/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Partial(BusinessSchema),
      response: {
        200: BusinessResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const business = await businessService.updateBusiness(id, request.body as Partial<Static<typeof BusinessSchema>>);
      return business;
    }
  });

  fastify.patch('/businesses/:id/status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Object({
        status: Type.String()
      }),
      response: {
        200: BusinessResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };
      const business = await businessService.updateBusinessStatus(id, status as any);
      return business;
    }
  });

  fastify.post('/businesses/:id/rating', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Object({
        rating: Type.Number({ minimum: 0, maximum: 5 })
      }),
      response: {
        200: BusinessResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { rating } = request.body as { rating: number };
      const business = await businessService.updateBusinessRating(id, rating);
      return business;
    }
  });

  fastify.delete('/businesses/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: Type.Null()
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await businessService.deleteBusiness(id);
      return reply.code(204).send();
    }
  });

  fastify.get('/businesses/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          category: { type: 'string' },
          status: { type: 'array', items: { type: 'string' } },
          longitude: { type: 'number' },
          latitude: { type: 'number' },
          maxDistance: { type: 'number', default: 5000 },
          limit: { type: 'number', default: 50 },
          skip: { type: 'number', default: 0 }
        },
        required: ['query']
      },
      response: {
        200: Type.Array(BusinessResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { query, category, status, longitude, latitude, maxDistance, limit, skip } = request.query as {
        query: string;
        category?: string;
        status?: string[];
        longitude?: number;
        latitude?: number;
        maxDistance?: number;
        limit?: number;
        skip?: number;
      };

      const businesses = await businessService.searchBusinesses(query, {
        category,
        status: status as any,
        location: longitude && latitude ? {
          longitude,
          latitude,
          maxDistance
        } : undefined,
        limit,
        skip
      });

      return businesses;
    }
  });
};

export default fp(businessPlugin, {
  name: 'business-plugin',
  dependencies: ['db-plugin']
}); 