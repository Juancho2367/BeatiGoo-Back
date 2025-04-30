import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

// Import plugins
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import userPlugin from './plugins/user';
import businessPlugin from './plugins/business';
import bookingPlugin from './plugins/booking';
import paymentPlugin from './plugins/payment';
import geoPlugin from './plugins/geo';
import notificationPlugin from './plugins/notification';

export async function buildApp() {
  const app = fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register core plugins
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet);

  // Register Swagger
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'BeautiGo API',
        description: 'API documentation for BeautiGo',
        version: '1.0.0'
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'businesses', description: 'Business management endpoints' },
        { name: 'bookings', description: 'Booking management endpoints' },
        { name: 'payments', description: 'Payment management endpoints' },
        { name: 'geo', description: 'Geolocation endpoints' },
        { name: 'notifications', description: 'Notification endpoints' }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation'
  });

  // Register database plugin first
  await app.register(dbPlugin);

  // Register other plugins
  await app.register(authPlugin);
  await app.register(userPlugin);
  await app.register(businessPlugin);
  await app.register(bookingPlugin);
  await app.register(paymentPlugin);
  await app.register(geoPlugin);
  await app.register(notificationPlugin);

  return app;
}

export default buildApp; 