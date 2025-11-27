import { Router } from 'express';
import { getCircuitBreakerStats } from '../middleware/circuitBreaker.js';
import { AggregationService } from '../services/aggregationService.js';
import { authorize } from '../middleware/authorization.js';
import logger from '../../logger.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

/**
 * Gateway Aggregation Pattern.
 *
 * Este módulo implementa endpoints que agregan información de múltiples microservicios
 * en una sola respuesta. Esto reduce el "chatiness" entre el cliente y el backend.
 *
 * Útil para:
 * - Dashboards
 * - Vistas de detalle complejas
 * - Reportes
 */

/**
 * GET /api/v1/dashboard
 * Obtiene dashboard completo del usuario.
 *
 * Agrega datos de:
 * - Users Service (Perfil)
 * - Payments Service (Pagos recientes)
 * - Analytics Service (Estadísticas)
 *
 * @param {import('express').Request} req - Objeto request de Express
 * @param {import('express').Response} res - Objeto response de Express
 */
router.get('/dashboard', async (req, res) => {
  const userId = req.user.userId;

  try {
    // Delegamos la lógica de negocio al servicio
    const aggregatedData = await AggregationService.getDashboardData(userId);

    // 200 OK: Respuesta de éxito estándar.
    sendSuccess(res, aggregatedData, 'Dashboard data retrieved successfully');
  } catch (error) {
    logger.error(`Dashboard aggregation failed: ${error.message}`);
    // 500 Internal Server Error: Fallo inesperado durante la agregación.
    sendError(res, 'Failed to aggregate dashboard data', 500, error.message);
  }
});

/**
 * GET /api/v1/circuit-breaker-stats
 * Endpoint administrativo para ver el estado de los circuit breakers.
 * Requiere rol 'admin'.
 */
router.get('/circuit-breaker-stats', authorize(['admin']), (req, res) => {
  const stats = getCircuitBreakerStats();

  // 200 OK: Respuesta de éxito estándar.
  sendSuccess(res, { circuitBreakers: stats }, 'Circuit breaker stats retrieved');
});

/**
 * Configura las rutas de agregación en la aplicación.
 * @param {import('express').Application} app - Aplicación Express
 */
export const setupAggregationRoutes = (app) => {
  app.use('/api/v1', router);
  logger.info('✅ Aggregation routes configured');
};
