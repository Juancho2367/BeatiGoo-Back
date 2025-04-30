import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PaymentService } from '../services/payment.service';
import {
  CreatePaymentRequestSchema,
  CreatePaymentResponseSchema,
  GetPaymentResponseSchema,
  UpdatePaymentStatusRequestSchema,
  UpdatePaymentStatusResponseSchema,
  RefundPaymentRequestSchema,
  RefundPaymentResponseSchema
} from '../schemas/payment.schema';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    paymentService: PaymentService;
  }
}

const paymentPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Register the payment service
  const paymentService = new PaymentService();
  fastify.decorate('paymentService', paymentService);

  // Register routes
  fastify.post('/payments', {
    schema: {
      body: CreatePaymentRequestSchema,
      response: {
        201: CreatePaymentResponseSchema
      }
    },
    handler: async (request, reply) => {
      const payment = await paymentService.createPayment(request.body as Static<typeof CreatePaymentRequestSchema>);
      return reply.code(201).send(payment);
    }
  });

  fastify.get('/payments/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: GetPaymentResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const payment = await paymentService.getPayment(id);
      return payment;
    }
  });

  fastify.patch('/payments/:id/status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: UpdatePaymentStatusRequestSchema,
      response: {
        200: UpdatePaymentStatusResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const payment = await paymentService.updatePaymentStatus(
        id,
        request.body as Static<typeof UpdatePaymentStatusRequestSchema>
      );
      return payment;
    }
  });

  fastify.post('/payments/:id/refund', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: RefundPaymentRequestSchema,
      response: {
        200: RefundPaymentResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const payment = await paymentService.refundPayment(
        id,
        request.body as Static<typeof RefundPaymentRequestSchema>
      );
      return payment;
    }
  });
};

export default fp(paymentPlugin, {
  name: 'payment-plugin',
  dependencies: []
}); 