import jwt from 'jsonwebtoken';
import logger from '../../logger.js';
import { sendError } from '../utils/response.js';
import { validateTokenWithAuthService } from '../services/tokenValidationService.js';
import {
  HEADER_USER_ID,
  HEADER_ROLES,
  HEADER_USERNAME,
  HEADER_GATEWAY_AUTHENTICATED,
  AUTH_BEARER_PREFIX,
  ENV_PRODUCTION,
  ERROR_TOKEN_EXPIRED,
  ERROR_JSON_WEB_TOKEN,
} from '../config/constants.js';

// En producción, es CRÍTICO que JWT_SECRET esté definido.
if (process.env.NODE_ENV === ENV_PRODUCTION && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not defined in production environment');
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware de autenticación centralizada.
 * Patrón: API Gateway Pattern - Centralized Authentication
 *
 * Valida el token JWT (firma) y luego verifica contra Redis (revocación)
 * antes de enviar la petición a los microservicios.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticateRequest = async (req, res, next) => {
  // Obtener token del header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith(AUTH_BEARER_PREFIX)) {
    logger.warn(`Authentication failed: No token provided for ${req.path}`);
    // 401 Unauthorized: Authentication is required and has failed or has not been yet provided.
    return sendError(res, 'Authentication required. No token provided.', 401);
  }

  const token = authHeader.replace(AUTH_BEARER_PREFIX, '');

  try {
    // Paso 1: Verificar firma JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug(`JWT signature verified for user: ${decoded.id || decoded.userId}`);

    // Paso 2: Validar contra Redis (verificar que no esté revocado)
    const validationResult = await validateTokenWithAuthService(token);

    logger.debug(
      `Redis validation result: ${JSON.stringify({ valid: validationResult.valid, error: validationResult.error })}`
    );

    if (!validationResult.valid) {
      logger.warn(
        `Token validation failed: ${validationResult.message || 'Token revoked or invalid'} (error: ${validationResult.error})`
      );
      return sendError(res, 'Token has been revoked or is invalid. Please login again.', 401);
    }

    // Token válido - usar datos del servicio de autenticación (más actualizados)
    const userData = validationResult.user || decoded;

    // Enriquecer headers para los microservicios
    req.headers[HEADER_USER_ID] = userData.id;
    req.headers[HEADER_GATEWAY_AUTHENTICATED] = 'true';
    req.headers[HEADER_USERNAME] = userData.username;

    if (userData.roles) {
      req.headers[HEADER_ROLES] = Array.isArray(userData.roles)
        ? userData.roles.join(',')
        : userData.roles;
    }

    logger.info(
      `User authenticated: ${userData.id} (${userData.username}) with roles: ${req.headers[HEADER_ROLES]}`
    );

    // Guardar usuario en request para uso interno del gateway (ej: rate limiter)
    req.user = userData;

    logger.debug(
      `User authenticated: ${userData.id} (${userData.username}) with roles: ${req.headers[HEADER_ROLES]}`
    );
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);

    if (error.name === ERROR_TOKEN_EXPIRED) {
      // 401 Unauthorized: Token expired is an authentication failure.
      return sendError(res, 'Token expired. Please login again.', 401);
    }

    if (error.name === ERROR_JSON_WEB_TOKEN) {
      // 401 Unauthorized: Invalid token signature or structure.
      return sendError(res, 'Invalid token. Verification failed.', 401);
    }

    // 401 Unauthorized: Generic authentication failure.
    return sendError(res, 'Authentication failed.', 401, error.message);
  }
};

/**
 * Función auxiliar para generar tokens (útil para testing).
 *
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} expiresIn - Tiempo de expiración (ej: '24h')
 * @returns {string} Token JWT firmado
 */
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
