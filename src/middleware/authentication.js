import jwt from 'jsonwebtoken';
import logger from '../../logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware de autenticación centralizada
 * Patrón 1: API Gateway Pattern - Centralized Authentication
 *
 * Valida el token JWT y enriquece la petición con información del usuario
 * antes de enviarla a los microservicios.
 */
export const authenticateRequest = (req, res, next) => {
  // Obtener token del header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`Authentication failed: No token provided for ${req.path}`);
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided',
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Enriquecer headers para los microservicios
    // Los microservicios ya NO necesitan validar el token
    req.headers['x-user-id'] = decoded.userId || decoded.id;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role'] = decoded.role || 'user';
    req.headers['x-pricing-plan'] = decoded.pricingPlan || 'free';
    req.headers['x-gateway-authenticated'] = 'true';

    // Guardar usuario en request para uso interno del gateway
    req.user = decoded;

    logger.debug(`User authenticated: ${decoded.userId} (${decoded.role})`);
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

/**
 * Función auxiliar para generar tokens (útil para testing)
 */
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
