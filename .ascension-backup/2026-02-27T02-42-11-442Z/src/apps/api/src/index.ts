/**
 * QAntum SaaS API Server
 * 
 * Main entry point for the API server using Fastify
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { clerkPlugin } from '@clerk/fastify';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Import routes
import { projectRoutes } from './routes/projects.js';
import { testRoutes } from './routes/tests.js';
import { runRoutes } from './routes/runs.js';
import { aiRoutes } from './routes/ai.js';
import { billingRoutes } from './routes/billing.js';
import { webhookRoutes } from './routes/webhooks.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { genesisRoutes } from './routes/genesis.js';

// Types
interface AppConfig {
  port: number;
  host: string;
  redis: {
    host: string;
    port: number;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
};

// Initialize Fastify
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

// Redis connection
const redis = new IORedis(config.redis);

// Job queue
const testQueue = new Queue('test-execution', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

await app.register(clerkPlugin, {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Decorate with shared resources
app.decorate('redis', redis);
app.decorate('testQueue', testQueue);

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

// API routes
app.register(projectRoutes, { prefix: '/api/v1/projects' });
app.register(testRoutes, { prefix: '/api/v1/tests' });
app.register(runRoutes, { prefix: '/api/v1/runs' });
app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
app.register(aiRoutes, { prefix: '/api/v1/ai' });
app.register(billingRoutes, { prefix: '/api/v1/billing' });
app.register(webhookRoutes, { prefix: '/webhooks' });
app.register(genesisRoutes, { prefix: '/api/v1/genesis' });

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;
  
  reply.status(statusCode).send({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
});

// Graceful shutdown
const shutdown = async () => {
  app.log.info('Shutting down...');
  await testQueue.close();
  await redis.quit();
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🧪 QAntum SaaS API v1.0.0                                ║
║                                                            ║
║   Server running at http://${config.host}:${config.port}              ║
║                                                            ║
║   Endpoints:                                               ║
║   • POST /api/v1/tests/run      - Execute tests            ║
║   • POST /api/v1/ai/generate    - AI test generation       ║
║   • GET  /api/v1/runs/:id       - Get run results          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
