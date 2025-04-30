import { FastifyPluginAsync } from 'fastify';
import { 
  UserLoginSchema, 
  RegisterSchema, 
  AuthResponseSchema, 
  UserLogin, 
  RegisterData,
  User
} from '../../schemas/user.schema';
import { UserService } from '../../services/user.service';
import mongoose from 'mongoose';

// Mongoose adds _id field to documents
interface UserDocument extends Omit<User, '_id'> {
  _id: mongoose.Types.ObjectId;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify);

  // Register a new user
  fastify.post<{ Body: RegisterData }>('/register', {
    schema: {
      body: RegisterSchema,
      response: {
        201: AuthResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      // Create the user
      const userData = await userService.register(request.body);
      const user = userData as unknown as UserDocument;
      
      // Generate JWT token
      const token = await reply.jwtSign({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      });
      
      // Return both user and token
      reply.code(201).send({
        user: userData,
        token
      });
    } catch (error) {
      reply.send(error);
    }
  });

  // Login user
  fastify.post<{ Body: UserLogin }>('/login', {
    schema: {
      body: UserLoginSchema,
      response: {
        200: AuthResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      // Validate credentials and get user
      const userData = await userService.login(request.body);
      
      if (!userData) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      
      const user = userData as unknown as UserDocument;
      
      // Generate JWT token
      const token = await reply.jwtSign({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      });
      
      // Return both user and token
      reply.send({
        user: userData,
        token
      });
    } catch (error) {
      reply.send(error);
    }
  });

  // Get current user profile
  fastify.get('/me', {
    config: {
      auth: {
        required: true
      }
    },
    schema: {
      response: {
        200: AuthResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const userData = await userService.findUserById(request.user.id);
      const user = userData as unknown as UserDocument;
      
      // Generate a new token
      const token = await reply.jwtSign({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      });
      
      reply.send({
        user: userData,
        token
      });
    } catch (error) {
      reply.send(error);
    }
  });

  // Logout - This is primarily handled on the client side by removing the token,
  // but we can implement token invalidation here if needed in the future
  fastify.post('/logout', {}, async (request, reply) => {
    // For now, just return a success message
    // In a more advanced implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Set up token rotation or refresh token logic
    reply.send({ success: true, message: 'Logout successful' });
  });
};

export default authRoutes; 