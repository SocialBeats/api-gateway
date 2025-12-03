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
import { corsOptions } from './src/config/cors.js';
import { sendSuccess } from './src/utils/response.js';

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
app.use(helmet());

// Compression: Comprime las respuestas HTTP (gzip) para mejorar la velocidad.
app.use(compression());

// CORS: Configuración de seguridad para orígenes cruzados.
app.use(cors(corsOptions));

// Parsing del body.
// NOTA: Esto puede causar problemas con proxies si no se maneja en onProxyReq (ver src/routes/proxy.js).
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// 3. AUTENTICACIÓN
// ============================================

/**
 * Middleware de autenticación global.
 *
 * Rutas públicas: Se definen explícitamente para saltar la validación de token.
 * Todas las demás rutas requieren un token JWT válido.
 */
const publicPaths = ['/v1/auth/register', '/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout'];

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
