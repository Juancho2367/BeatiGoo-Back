import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import { config } from '../config/env';

export interface AuthPluginOptions {
  secret?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: string;
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyContextConfig {
    auth?: {
      required?: boolean;
    };
  }
}

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, opts) => {
  const secret = opts.secret || config.JWT_SECRET;

  // Register JWT plugin
  await fastify.register(jwt, {
    secret,
  });

  // Decorator to handle authentication
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Hook to verify authentication for protected routes
  fastify.addHook('onRequest', async (request, reply) => {
    const authRequired = request.routeOptions.config?.auth?.required ?? false;
    
    if (authRequired) {
      await fastify.authenticate(request, reply);
    }
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: [],
}); 