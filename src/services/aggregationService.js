import { protectedRequest } from '../middleware/circuitBreaker.js';
import { services } from '../config/services.js';
import logger from '../../logger.js';

/**
 * Servicio para agregar datos de múltiples microservicios.
 *
 * Este servicio encapsula la lógica de negocio para obtener y combinar datos
 * de varias fuentes (Users, Payments, Analytics). Maneja ejecución paralela
 * y fallos parciales de forma elegante.
 */
export class AggregationService {
  /**
   * Obtiene y agrega datos del dashboard para un usuario específico.
   *
   * @param {string} userId - El ID del usuario
   * @returns {Promise<Object>} Los datos agregados del dashboard
   */
  static async getDashboardData(userId) {
    const startTime = Date.now();
    logger.info(`Aggregating dashboard data for user ${userId}`);

    // Ejecutamos las peticiones en PARALELO para minimizar la latencia total.
    // Usamos Promise.all para esperar a que todas terminen.
    const [profileResponse, paymentsResponse, analyticsResponse] = await Promise.all([
      // 1. Obtener Perfil de Usuario
      protectedRequest('users', services.users.url, {
        method: 'GET',
        url: `/api/v1/users/${userId}`,
        headers: {
          'x-user-id': userId,
          'x-gateway-authenticated': 'true',
        },
      }).catch((err) => {
        // MANEJO DE ERRORES PARCIALES:
        // Si el servicio de usuarios falla, no queremos romper todo el dashboard.
        logger.warn(`Failed to fetch profile: ${err.message}`);
        return { data: null, error: 'Profile service unavailable' };
      }),

      // 2. Obtener Pagos Recientes
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

      // 3. Obtener Estadísticas de Analytics
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
    logger.info(`Dashboard aggregation completed in ${duration}ms for user ${userId}`);

    return {
      profile: profileResponse.data,
      payments: paymentsResponse.data,
      analytics: analyticsResponse.data,
      metadata: {
        aggregationTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
