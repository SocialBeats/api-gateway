import { sendError } from '../utils/response.js';
import logger from '../../logger.js';

/**
 * Middleware de autorización basado en roles.
 * Patrón: Higher-Order Function Middleware
 *
 * Este middleware verifica si el usuario autenticado tiene uno de los roles permitidos
 * para acceder a un recurso.
 *
 * Requisitos previos:
 * - Debe ejecutarse DESPUÉS del middleware de autenticación.
 * - `req.user` debe estar poblado.
 *
 * @param {string[]} allowedRoles - Lista de roles permitidos (ej: ['admin', 'user'])
 * @returns {import('express').RequestHandler} Middleware de Express
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // 1. Verificar si el usuario está autenticado (req.user debe existir)
    if (!req.user) {
      logger.warn(
        'Authorization failed: User context missing. Is authentication middleware present?'
      );
      // 401 Unauthorized: El usuario no ha probado su identidad.
      return sendError(res, 'Authentication required.', 401);
    }

    // 2. Verificar si el usuario tiene un rol válido
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        `Authorization denied: User ${req.user.userId} with role '${userRole}' attempted to access protected resource. Required: [${allowedRoles.join(', ')}]`
      );
      // 403 Forbidden: El usuario está autenticado pero no tiene permisos suficientes.
      return sendError(res, 'Access denied. Insufficient permissions.', 403);
    }

    // 3. Autorización exitosa
    logger.debug(
      `Authorization granted: User ${req.user.userId} (${userRole}) accessed protected resource.`
    );
    next();
  };
};
