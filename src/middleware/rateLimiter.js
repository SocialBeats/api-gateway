import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import logger from '../../logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

// Usamos una IIFE (Función autoejecutable asíncrona) para conectar
// ya que 'node-redis' v4+ requiere conexión asíncrona con .connect()
(async () => {
  try {
    redisClient = createClient({
      url: REDIS_URL,
    });

    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redisClient.on('connect', () => logger.info('✅ Redis connected for rate limiting'));

    await redisClient.connect();
  } catch (error) {
    logger.warn(`⚠️ Redis not available, using in-memory rate limiting. Error: ${error.message}`);
    // Si falla la conexión, redisClient se quedará como 'undefined'
    // y el rate limiter usará la memoria local (como ya tenías programado).
    redisClient = undefined;
  }
})();

/**
 * Rate Limiter con límites basados en plan de precios
 * Patrón 2: Throttling/Rate Limiting Pattern
 *
 * Implementa límites de uso según el plan de precios del usuario.
 * Cumple con el requisito: "límites de uso según su plan de precios"
 */
export const createRateLimiter = () => {
  const limiterConfig = {
    windowMs: 60 * 1000, // 1 minuto

    // Límite dinámico basado en el plan de precios
    max: async (req) => {
      // Si no está autenticado aún, aplicar límite básico
      if (!req.user) {
        return 20; // 20 req/min para no autenticados
      }

      const plan = req.user.pricingPlan || req.headers['x-pricing-plan'] || 'free';

      // Límites por plan de precios
      const limits = {
        free: 10, // 10 peticiones por minuto
        basic: 50, // 50 peticiones por minuto
        premium: 200, // 200 peticiones por minuto
        enterprise: 1000, // 1000 peticiones por minuto
      };

      const limit = limits[plan] || limits['free'];
      logger.debug(`Rate limit for plan ${plan}: ${limit} req/min`);

      return limit;
    },

    // Identificador del usuario
    keyGenerator: (req) => {
      // Usar user ID si está autenticado, sino IP
      return req.user?.userId || req.headers['x-user-id'] || req.ip;
    },

    // Mensaje cuando se excede el límite
    handler: (req, res) => {
      const plan = req.user?.pricingPlan || 'free';
      logger.warn(`Rate limit exceeded for user: ${req.user?.userId} (plan: ${plan})`);

      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded for ${plan} plan`,
        currentPlan: plan,
        upgradeInfo: 'Upgrade your plan for higher limits',
        retryAfter: res.getHeader('Retry-After'),
      });
    },

    // Headers estándar de rate limiting
    standardHeaders: true,
    legacyHeaders: false,

    // Configurar Redis store si el cliente está disponible
    ...(redisClient && {
      store: new RedisStore({
        // rate-limit-redis requiere una función sendCommand, no el cliente directamente
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rate_limit:',
      }),
    }),
  };

  return rateLimit(limiterConfig);
};

/**
 * Rate Limiter específico para endpoints sensibles (login, registro)
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error: 'Too many attempts',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,

  // Si quieres que este limiter también use Redis, aplica la misma lógica
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rate_limit_strict:',
    }),
  }),
});
