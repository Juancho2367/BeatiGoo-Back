import { FastifyPluginAsync } from 'fastify';
import { UserSchema, UserResponseSchema, User } from '../../schemas/user.schema';
import { UserService } from '../../services/user.service';
import { Type } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
    }
  }
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify);

  // Get user profile
  fastify.get('/me', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      response: {
        200: UserResponseSchema
      }
    }
  }, async (request) => {
    const user = await userService.findUserById(request.user.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });

  // Update user profile
  fastify.put<{ Body: Partial<User> }>('/me', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      body: Type.Partial(UserSchema),
      response: {
        200: UserResponseSchema
      }
    }
  }, async (request) => {
    const user = await userService.updateUser(request.user.id, request.body);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });

  // Delete user
  fastify.delete('/me', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      response: {
        204: {
          type: 'null'
        }
      }
    }
  }, async (request, reply) => {
    await userService.deleteUser(request.user.id);
    reply.code(204).send();
  });

  // Admin routes - only accessible to admins
  // Get all users
  fastify.get('/', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      response: {
        200: Type.Array(UserResponseSchema)
      }
    },
    preHandler: async (request, reply) => {
      // Check if user is an admin
      if (request.user.role !== 'admin') {
        reply.code(403).send({ error: 'Forbidden: Admin access required' });
        return reply;
      }
    }
  }, async () => {
    // This would need to be implemented in the service
    // For now just return an empty array
    return [];
  });
};

export default userRoutes; 