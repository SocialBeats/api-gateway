import jwt from 'jsonwebtoken';
import logger from '../../logger.js';
import { sendError } from '../utils/response.js';
import {
  HEADER_USER_ID,
  HEADER_ROLES,
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
 * Valida el token JWT y enriquece la petición con información del usuario
 * antes de enviarla a los microservicios.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticateRequest = (req, res, next) => {
  // Obtener token del header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith(AUTH_BEARER_PREFIX)) {
    logger.warn(`Authentication failed: No token provided for ${req.path}`);
    // 401 Unauthorized: Authentication is required and has failed or has not been yet provided.
    return sendError(res, 'Authentication required. No token provided.', 401);
  }

  const token = authHeader.replace(AUTH_BEARER_PREFIX, '');

  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Enriquecer headers para los microservicios
    // Los microservicios ya NO necesitan validar el token, confían en el Gateway.
    logger.debug(`Token decoded: ${JSON.stringify(decoded)}`);
    req.headers[HEADER_USER_ID] = decoded.userId || decoded.id;
    req.headers[HEADER_GATEWAY_AUTHENTICATED] = 'true';

    if (decoded.roles) {
      req.headers[HEADER_ROLES] = JSON.stringify(decoded.roles);
    }

    // Guardar usuario en request para uso interno del gateway (ej: rate limiter)
    req.user = decoded;

    logger.debug(`User authenticated: ${decoded.userId} (${decoded.role})`);
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
