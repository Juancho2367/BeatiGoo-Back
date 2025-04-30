import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UserService, createUserService } from '../services/user.service';
import {
  UserSchema,
  UserResponseSchema
} from '../schemas/user.schema';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    userService: UserService;
  }
}

const userPlugin: FastifyPluginAsync = async (fastify, options) => {
  const userService = createUserService(fastify);
  fastify.decorate('userService', userService);

  // Register routes
  fastify.post('/users', {
    schema: {
      body: UserSchema,
      response: {
        201: UserResponseSchema
      }
    },
    handler: async (request, reply) => {
      const user = await userService.createUser(request.body as Static<typeof UserSchema>);
      return reply.code(201).send(user);
    }
  });

  fastify.get('/users/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: UserResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await userService.findUserById(id);
      return user;
    }
  });

  fastify.patch('/users/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: Type.Partial(UserSchema),
      response: {
        200: UserResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await userService.updateUser(id, request.body as Partial<Static<typeof UserSchema>>);
      return user;
    }
  });

  fastify.delete('/users/:id', {
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
      await userService.deleteUser(id);
      return reply.code(204).send();
    }
  });
};

export default fp(userPlugin, {
  name: 'user-plugin',
  dependencies: ['db-plugin']
}); 