import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BookingService, createBookingService } from '../services/booking.service';
import {
  BookingSchema,
  BookingResponseSchema
} from '../schemas/booking.schema';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    bookingService: BookingService;
  }
}

const bookingPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Register the booking service with Fastify instance
  const bookingService = createBookingService(fastify);
  fastify.decorate('bookingService', bookingService);

  // Register routes
  fastify.post('/bookings', {
    schema: {
      body: BookingSchema,
      response: {
        201: BookingResponseSchema
      }
    },
    handler: async (request, reply) => {
      const booking = await bookingService.createBooking(request.body as Static<typeof BookingSchema>);
      return reply.code(201).send(booking);
    }
  });

  fastify.get('/bookings/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: BookingResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const booking = await bookingService.findBookingById(id);
      return booking;
    }
  });

  fastify.get('/bookings/user/:userId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'array', items: { type: 'string' } },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', default: 50 },
          skip: { type: 'number', default: 0 }
        }
      },
      response: {
        200: Type.Array(BookingResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { status, startDate, endDate, limit, skip } = request.query as {
        status?: string[];
        startDate?: string;
        endDate?: string;
        limit?: number;
        skip?: number;
      };

      const bookings = await bookingService.findBookingsByUser(userId, {
        status: status as any,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        skip
      });

      return bookings;
    }
  });

  fastify.get('/bookings/business/:businessId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          businessId: { type: 'string' }
        },
        required: ['businessId']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'array', items: { type: 'string' } },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', default: 50 },
          skip: { type: 'number', default: 0 }
        }
      },
      response: {
        200: Type.Array(BookingResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { businessId } = request.params as { businessId: string };
      const { status, startDate, endDate, limit, skip } = request.query as {
        status?: string[];
        startDate?: string;
        endDate?: string;
        limit?: number;
        skip?: number;
      };

      const bookings = await bookingService.findBookingsByBusiness(businessId, {
        status: status as any,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        skip
      });

      return bookings;
    }
  });

  fastify.patch('/bookings/:id/status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Object({
        status: Type.String(),
        notes: Type.Optional(Type.String())
      }),
      response: {
        200: BookingResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, notes } = request.body as { status: string; notes?: string };
      const booking = await bookingService.updateBookingStatus(id, status as any, notes);
      return booking;
    }
  });

  fastify.patch('/bookings/:id/payment-status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Object({
        paymentStatus: Type.String(),
        paymentId: Type.Optional(Type.String())
      }),
      response: {
        200: BookingResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { paymentStatus, paymentId } = request.body as { paymentStatus: string; paymentId?: string };
      const booking = await bookingService.updatePaymentStatus(id, paymentStatus as any, paymentId);
      return booking;
    }
  });

  fastify.post('/bookings/:id/cancel', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Object({
        reason: Type.String()
      }),
      response: {
        200: BookingResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };
      const booking = await bookingService.cancelBooking(id, reason);
      return booking;
    }
  });

  fastify.delete('/bookings/:id', {
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
      await bookingService.deleteBooking(id);
      return reply.code(204).send();
    }
  });
};

export default fp(bookingPlugin, {
  name: 'booking-plugin',
  dependencies: ['db-plugin']
}); 