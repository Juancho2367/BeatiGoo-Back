import { FastifyPluginAsync } from 'fastify';
import { UserSchema, UserLoginSchema, UserResponseSchema, User, UserLogin } from '../../schemas/user.schema';
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

  // Register user
  fastify.post<{ Body: User }>('/register', {
    schema: {
      body: UserSchema,
      response: {
        201: UserResponseSchema
      }
    }
  }, async (request, reply) => {
    const user = await userService.createUser(request.body);
    reply.code(201).send(user);
  });

  // Login user
  fastify.post<{ Body: UserLogin }>('/login', {
    schema: {
      body: UserLoginSchema,
      response: {
        200: Type.Object({
          token: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const user = await userService.validateUser(request.body);
    
    if (!user) {
      reply.code(401).send({ message: 'Invalid credentials' });
      return;
    }

    const token = await reply.jwtSign({
      id: user._id,
      email: user.email,
      role: user.role
    });

    reply.send({ token });
  });

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
  fastify.put<{ Body: User }>('/me', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      body: UserSchema,
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
};

export default userRoutes; 