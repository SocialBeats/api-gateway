import axios from 'axios';
import logger from '../../logger.js';
import { getServiceUrl } from '../config/services.js';

/**
 * Valida un access token contra el servicio de autenticación (Redis)
 * @param {string} token - Access token a validar
 * @returns {Promise<{valid: boolean, user?: object}>} - Resultado de validación
 */
export async function validateTokenWithAuthService(token) {
  try {
    const authServiceUrl = getServiceUrl('users');
    logger.debug(`Validating token with auth service: ${authServiceUrl}`);

    const response = await axios.post(
      `${authServiceUrl}/api/v1/auth/validate-token`,
      { token },
      {
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    logger.debug(`Token validation response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logger.error(`Token validation request failed: ${error.message}`);

    // Si el servicio responde con datos (ej: 400, 500), devolverlos
    if (error.response?.data) {
      logger.debug(`Token validation error response: ${JSON.stringify(error.response.data)}`);
      return error.response.data;
    }

    // Si el servicio no responde (timeout, red caída), considerarlo inválido
    return {
      valid: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Authentication service unavailable',
    };
  }
}
