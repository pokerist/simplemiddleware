import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from '../config/config';
import executeRoutes from './routes/execute';

const server = fastify({
  logger: true // Use Fastify's logger for robust logging
});

// Register Static File Serving for UI
server.register(fastifyStatic, {
  root: path.join(__dirname, '../../src/ui'),
  prefix: '/', // Serve at root
});

// Register API Routes
server.register(executeRoutes);

// Health check
server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    const address = await server.listen({ port: config.server.port, host: '0.0.0.0' });
    console.log(`Server listening at ${address}`);
    console.log(`UI available at http://localhost:${config.server.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
