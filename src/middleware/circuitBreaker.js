import CircuitBreaker from 'opossum';
import axios from 'axios';
import logger from '../../logger.js';

/**
 * Circuit Breaker Pattern.
 * Patrón: Resiliencia - Evita sobrecargar servicios que están fallando.
 *
 * Utiliza la librería 'opossum' para envolver las llamadas HTTP.
 */

const breakerOptions = {
  timeout: 5000, // Si la petición tarda >5s, falla
  errorThresholdPercentage: 50, // Si falla >50% de las peticiones
  resetTimeout: 30000, // Reintentar después de 30s
  rollingCountTimeout: 10000, // Ventana de 10s para estadísticas
  rollingCountBuckets: 10, // Dividir ventana en 10 buckets
  volumeThreshold: 5, // Mínimo 5 peticiones antes de abrir
};

// Almacenar circuit breakers por servicio
const breakers = new Map();

/**
 * Crear o obtener circuit breaker para un servicio.
 *
 * @param {string} serviceName - Nombre del servicio
 * @param {string} serviceUrl - URL base del servicio
 * @returns {CircuitBreaker} Instancia del circuit breaker
 */
export const getCircuitBreaker = (serviceName, serviceUrl) => {
  if (breakers.has(serviceName)) {
    return breakers.get(serviceName);
  }

  const protectedFunction = async (config) => {
    return await axios(config);
  };

  const breaker = new CircuitBreaker(protectedFunction, {
    ...breakerOptions,
    name: serviceName,
  });

  breaker.on('open', () => {
    logger.error(`🔴 Circuit breaker OPENED for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    logger.warn(`🟡 Circuit breaker HALF-OPEN for ${serviceName}`);
  });

  breaker.on('close', () => {
    logger.info(`🟢 Circuit breaker CLOSED for ${serviceName}`);
  });

  breaker.on('failure', (error) => {
    logger.warn(`❌ Circuit breaker failure for ${serviceName}: ${error.message}`);
  });

  breaker.on('success', () => {
    logger.debug(`✅ Circuit breaker success for ${serviceName}`);
  });

  breaker.on('timeout', () => {
    logger.warn(`⏱️  Circuit breaker timeout for ${serviceName}`);
  });

  breaker.on('reject', () => {
    logger.warn(`🚫 Circuit breaker rejected request for ${serviceName}`);
  });

  breaker.fallback((error) => {
    logger.warn(`Using fallback for ${serviceName}`);
    return {
      data: {
        error: 'Service temporarily unavailable',
        service: serviceName,
        fallback: true,
        message: 'Please try again later',
      },
      status: 503,
    };
  });

  breakers.set(serviceName, breaker);
  return breaker;
};

/**
 * Hacer petición HTTP protegida por circuit breaker.
 *
 * @param {string} serviceName - Nombre del servicio destino
 * @param {string} serviceUrl - URL base del servicio
 * @param {import('axios').AxiosRequestConfig} config - Configuración de la petición axios
 * @returns {Promise<import('axios').AxiosResponse>} Respuesta de axios
 */
export const protectedRequest = async (serviceName, serviceUrl, config) => {
  const breaker = getCircuitBreaker(serviceName, serviceUrl);

  try {
    const response = await breaker.fire({
      ...config,
      baseURL: serviceUrl,
    });
    return response;
  } catch (error) {
    logger.error(`Protected request failed for ${serviceName}: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener estadísticas de circuit breakers.
 * Útil para monitoreo y dashboards de administración.
 *
 * @returns {Object} Estadísticas de todos los circuit breakers
 */
export const getCircuitBreakerStats = () => {
  const stats = {};

  breakers.forEach((breaker, serviceName) => {
    stats[serviceName] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
    };
  });

  return stats;
};
