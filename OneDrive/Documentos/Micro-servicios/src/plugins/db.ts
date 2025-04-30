import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify, options) => {
  try {
    const MONGODB_URI = "mongodb+srv://anonymous1279r:oXfcbNBChM3UvaFl@beautigo.sj0jhti.mongodb.net/?retryWrites=true&w=majority&appName=BeautiGo";

    // Configure mongoose
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Decorate fastify with mongoose
    fastify.decorate('mongoose', mongoose);

    // Log connection success
    fastify.log.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      fastify.log.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      fastify.log.warn('MongoDB disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        fastify.log.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        fastify.log.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    fastify.log.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export default fp(dbPlugin, {
  name: 'db-plugin',
  dependencies: []
}); 