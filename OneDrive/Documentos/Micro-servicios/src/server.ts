import { config } from './config/env.js';
import { buildApp } from './app.js';

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`Server is running on ${config.HOST}:${config.PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start(); 