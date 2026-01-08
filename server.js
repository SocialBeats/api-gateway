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
import { initSpaceClient } from './src/lib/spaceClient.js';
import { setupProxyRoutes } from './src/routes/proxy.js';
import { setupAggregationRoutes } from './src/routes/aggregation.js';
import { errorHandler } from './src/utils/errorHandler.js';
import { corsOptions } from './src/config/cors.js';
import { sendSuccess } from './src/utils/response.js';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. MIDDLEWARES GLOBALES
// ============================================

// Helmet: Configuración básica sin CSP que pueda interferir con proxies
app.use(
  helmet({
    contentSecurityPolicy: false, // Desactivar CSP para evitar conflictos con proxies
  })
);

// Compression
app.use(compression());

// CORS
app.use(cors(corsOptions));

// Parsing del body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MIDDLEWARE DE SPACE (PRICING TOKEN)
// ============================================
initSpaceClient({
  url: process.env.SPACE_URL,
  apiKey: process.env.SPACE_API_KEY,
});
logger.info('🚀 SpaceClient inicializado para Pricing Tokens');

// ============================================
// 2. HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  sendSuccess(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
    'Gateway is healthy'
  );
});

// ============================================
// SWAGGER UI - DOCUMENTACIÓN API
// ============================================

// Servir archivos estáticos de OAS
app.use('/api/v1/oas', express.static(path.join(__dirname, 'oas')));

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { name: 'User & Auth Service', url: '/api/v1/oas/user-auth.yaml' },
      { name: 'Payments & Subscriptions', url: '/api/v1/oas/payments-and-suscriptions.yaml' },
      { name: 'Analytics & Dashboards', url: '/api/v1/oas/analytics-and-dashboards.yaml' },
      { name: 'Beats Upload', url: '/api/v1/oas/beats-upload.yaml' },
      { name: 'Beats Interaction', url: '/api/v1/oas/beats-interaction.yaml' },
      { name: 'Social Service', url: '/api/v1/oas/social.yaml' },
    ],
  },
  customSiteTitle: 'Socialbeats API Documentation',
};

app.use(
  '/api/v1/docs',
  swaggerUi.serveFiles(null, swaggerOptions),
  swaggerUi.setup(null, swaggerOptions)
);

// Redirect root a docs
app.get('/', (req, res) => {
  res.redirect('/api/v1/docs');
});

// ============================================
// 3. AUTENTICACIÓN
// ============================================

const publicPaths = [
  '/v1/auth/register',
  '/v1/auth/login',
  '/v1/auth/refresh',
  '/v1/auth/logout',
  '/v1/auth/2fa/verify',
  '/v1/profile/internal',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/verify-email',
  '/v1/auth/resend-verification',
];

app.use('/api', (req, res, next) => {
  const isPublic = publicPaths.some((path) => {
    if (path.includes(':')) {
      const regexPath = path.replace(/:[^\s/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexPath}$`);
      return regex.test(req.path);
    }
    return req.path === path || req.path.startsWith(path + '/');
  });

  if (isPublic) {
    return next();
  }

  authenticateRequest(req, res, next);
});

// ============================================
// 4. RATE LIMITING
// ============================================

const rateLimiter = createRateLimiter();
app.use('/api', rateLimiter);

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
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔒 Authentication: ENABLED`);
    logger.info(`⚡ Rate Limiting: ENABLED`);
  });
}

// Manejo de shutdown graceful
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
