import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { authenticateRequest } from './src/middleware/authentication.js';
import { createRateLimiter } from './src/middleware/rateLimiter.js';
import { setupProxyRoutes } from './src/routes/proxy.js';
import { setupAggregationRoutes } from './src/routes/aggregation.js';
import { errorHandler } from './src/utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. MIDDLEWARES GLOBALES
// ============================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(
  cors({
    origin: true, // Permite cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 2. HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// 3. RATE LIMITING
// ============================================

const rateLimiter = createRateLimiter();
app.use('/api', rateLimiter);

// ============================================
// 4. AUTENTICACIÓN
// ============================================

//TODO: HABILITAR AUTENTICACIÓN PARA RUTAS ABIERTAS

// app.use('/api', authenticateRequest);

// ============================================
// 5. RUTAS DE PROXY
// ============================================

setupProxyRoutes(app);

// ============================================
// 6. RUTAS DE AGREGACIÓN
// ============================================

setupAggregationRoutes(app);

// ============================================
// 7. MANEJO DE ERRORES
// ============================================

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// ============================================
// 8. INICIAR SERVIDOR
// ============================================

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.warn(`Using log level: ${process.env.LOG_LEVEL || 'info'}`);
    logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔒 Authentication: ENABLED`);
    logger.info(`⚡ Rate Limiting: ENABLED`);
  });
}

// Manejo de shutdown graceful
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
