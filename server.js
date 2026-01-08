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

/**
 * Variables de entorno críticas.
 *
 * @env PORT - Puerto del servidor (default: 3000)
 * @env NODE_ENV - Entorno (development, production, test)
 * @env ALLOWED_ORIGINS - Lista de orígenes permitidos separados por comas (prod)
 * @env JWT_SECRET - Secreto para firmar tokens
 * @env REDIS_URL - URL de conexión a Redis
 */

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. MIDDLEWARES GLOBALES
// ============================================

// Helmet: Protege la app configurando varios headers HTTP seguros.
// Configuración especial para permitir Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
        connectSrc: [
          "'self'",
          'https://unpkg.com',
          'https://api.socialbeats.es', // Producción
          'http://localhost:3000', // Local
          'http://localhost:*', // Cualquier puerto local
        ],
      },
    },
  })
);

app.use((req, res, next) => {
  // Prefijo externo esperado
  const forwardedPrefix = req.headers['x-forwarded-prefix'] || '/socialbeats-api';
  req.publicBasePath = forwardedPrefix;
  next();
});

// Compression: Comprime las respuestas HTTP (gzip) para mejorar la velocidad.
app.use(compression());

// CORS: Configuración de seguridad para orígenes cruzados.
app.use(cors(corsOptions));

// Parsing del body.
// NOTA: Esto puede causar problemas con proxies si no se maneja en onProxyReq (ver src/routes/proxy.js).
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

/**
 * Endpoint de salud para monitoreo (k8s, load balancers).
 */
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
app.use('/oas', express.static(path.join(__dirname, 'oas')));

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { name: 'User & Auth Service', url: `oas/user-auth.yaml` },
      { name: 'Payments & Subscriptions', url: `oas/payments-and-suscriptions.yaml` },
      { name: 'Analytics & Dashboards', url: `oas/analytics-and-dashboards.yaml` },
      { name: 'Beats Upload', url: `oas/beats-upload.yaml` },
      { name: 'Beats Interaction', url: `oas/beats-interaction.yaml` },
      { name: 'Social Service', url: `oas/social.yaml` },
    ],
  },
  customSiteTitle: 'Socialbeats API Documentation',
};

app.use(
  '/api-docs',
  swaggerUi.serveFiles(null, swaggerOptions),
  swaggerUi.setup(null, swaggerOptions)
);

app.get('/', (req, res) => {
  res.redirect('api-docs');
});

// ============================================
// 3. AUTENTICACIÓN
// ============================================

/**
 * Middleware de autenticación global.
 *
 * Rutas públicas: Se definen explícitamente para saltar la validación de token.
 * Todas las demás rutas requieren un token JWT válido.
 */
const publicPaths = [
  '/v1/auth/register',
  '/v1/auth/login',
  '/v1/auth/refresh',
  '/v1/auth/logout',
  '/v1/auth/2fa/verify',
  '/v1/profile/internal', // Rutas internas protegidas por API Key, no por JWT
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/verify-email',
  '/v1/auth/resend-verification',
];

app.use('/api', (req, res, next) => {
  // Verificar si la ruta es pública
  // Se usa .some() para verificar si la ruta actual COMIENZA con alguna de las rutas públicas
  // o coincide con patrones dinámicos
  const isPublic = publicPaths.some((path) => {
    // Si el path tiene parámetros (ej: :id), convertimos a regex simple
    if (path.includes(':')) {
      const regexPath = path.replace(/:[^\s/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexPath}$`);
      return regex.test(req.path);
    }
    // Para rutas estáticas, coincidencia exacta o prefijo
    return req.path === path || req.path.startsWith(path + '/');
  });

  if (isPublic) {
    return next();
  }

  // Aplicar autenticación
  authenticateRequest(req, res, next);
});

// ============================================
// 4. RATE LIMITING
// ============================================

// Se aplica DESPUÉS de la autenticación para tener acceso a req.user
// y poder aplicar límites basados en el plan de precios.
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
    logger.info(`📚 API Documentation: http://localhost:${PORT}/`);
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
