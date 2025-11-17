import { Router } from 'express';
import { protectedRequest, getCircuitBreakerStats } from '../middleware/circuitBreaker.js';
import { services } from '../config/services.js';
import logger from '../../logger.js';

const router = Router();

/**
 * Gateway Aggregation Pattern (Patrón 3)
 */

/**
 * GET /api/v1/dashboard
 * Obtiene dashboard completo del usuario
 */
router.get('/dashboard', async (req, res) => {
  const userId = req.user.userId;
  const startTime = Date.now();

  try {
    logger.info(`Aggregating dashboard data for user ${userId}`);

    const [profileResponse, paymentsResponse, analyticsResponse] = await Promise.all([
      protectedRequest('users', services.users.url, {
        method: 'GET',
        url: `/api/v1/users/${userId}`,
        headers: {
          'x-user-id': userId,
          'x-gateway-authenticated': 'true',
        },
      }).catch((err) => {
        logger.warn(`Failed to fetch profile: ${err.message}`);
        return { data: null, error: 'Profile service unavailable' };
      }),

      protectedRequest('payments', services.payments.url, {
        method: 'GET',
        url: `/api/v1/payments/users/${userId}/recent`,
        headers: {
          'x-user-id': userId,
          'x-gateway-authenticated': 'true',
        },
      }).catch((err) => {
        logger.warn(`Failed to fetch payments: ${err.message}`);
        return { data: [], error: 'Payments service unavailable' };
      }),

      protectedRequest('analytics', services.analytics.url, {
        method: 'GET',
        url: `/api/v1/analytics/users/${userId}/stats`,
        headers: {
          'x-user-id': userId,
          'x-gateway-authenticated': 'true',
        },
      }).catch((err) => {
        logger.warn(`Failed to fetch analytics: ${err.message}`);
        return { data: null, error: 'Analytics service unavailable' };
      }),
    ]);

    const duration = Date.now() - startTime;

    const aggregatedData = {
      profile: profileResponse.data,
      payments: paymentsResponse.data,
      analytics: analyticsResponse.data,
      metadata: {
        aggregationTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info(`Dashboard aggregation completed in ${duration}ms for user ${userId}`);
    res.json(aggregatedData);
  } catch (error) {
    logger.error(`Dashboard aggregation failed: ${error.message}`);
    res.status(500).json({
      error: 'Failed to aggregate dashboard data',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/circuit-breaker-stats
 * Endpoint administrativo
 */
router.get('/circuit-breaker-stats', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  const stats = getCircuitBreakerStats();

  res.json({
    circuitBreakers: stats,
    timestamp: new Date().toISOString(),
  });
});

export const setupAggregationRoutes = (app) => {
  app.use('/api/v1', router);
  logger.info('✅ Aggregation routes configured');
};
