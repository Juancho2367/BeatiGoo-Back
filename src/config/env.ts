import { Type } from '@sinclair/typebox';

export const envSchema = Type.Object({
  PORT: Type.Number({ default: 3001 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  NODE_ENV: Type.String({ default: 'development' }),
  MONGODB_URI: Type.String({ default: 'mongodb+srv://anonymous1279r:qJ5CxnxnKJi6ehbg@beautigo.sj0jhti.mongodb.net/?retryWrites=true&w=majority&appName=BeautiGo' }),
  JWT_SECRET: Type.String({ default: 'your-super-secret-key-change-this-in-production' }),
  RATE_LIMIT_MAX: Type.Number({ default: 100 }),
  RATE_LIMIT_TIME_WINDOW: Type.Number({ default: 60000 })
});

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://anonymous1279r:qJ5CxnxnKJi6ehbg@beautigo.sj0jhti.mongodb.net/?retryWrites=true&w=majority&appName=BeautiGo',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 60000
}; 