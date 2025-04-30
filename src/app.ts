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

// Import API routes
import userRoutes from './routes/v1/users';
import authRoutes from './routes/v1/auth';
import geoRoutes from './routes/v1/geolocation';

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

  // Register API routes v1
  app.register((fastify, options, done) => {
    // Auth routes
    fastify.register(authRoutes, { prefix: '/auth' });
    
    // User routes
    fastify.register(userRoutes, { prefix: '/users' });
    
    // Geo routes
    fastify.register(geoRoutes, { prefix: '/geo' });
    
    done();
  }, { prefix: '/api/v1' });

  return app;
}

export default buildApp; 