import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from '../config/services.js';
import logger from '../../logger.js';
import { sendError } from '../utils/response.js';
import {
  HEADER_CONTENT_TYPE,
  HEADER_CONTENT_LENGTH,
  HEADER_ACCESS_CONTROL_ALLOW_ORIGIN,
  HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS,
  CONTENT_TYPE_JSON,
} from '../config/constants.js';

/**
 * Función factory para crear un proxy de servicio con configuración estándar.
 *
 * @param {Object} app - Instancia de aplicación Express
 * @param {string} route - La ruta base para el proxy (ej: '/api/v1/users')
 * @param {string} target - La URL destino del microservicio
 * @param {string} serviceName - El nombre del servicio para logging
 * @param {Object} pathRewrite - Reglas opcionales de reescritura de path
 */
const createServiceProxy = (
  app,
  route,
  target,
  serviceName,
  pathRewrite = {
    [`^${route}`]: route,
  }
) => {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to ${serviceName} Service: ${req.method} ${req.originalUrl}`);

        // Asegurar que los headers de autenticación se pasen al microservicio
        const authHeaders = [
          'x-gateway-authenticated',
          'x-user-id',
          'x-roles',
          'x-username',
          'x-user-pricing-plan',
          'x-internal-api-key', // Para rutas internas protegidas por API Key
        ];

        authHeaders.forEach((header) => {
          if (req.headers[header]) {
            proxyReq.setHeader(header, req.headers[header]);
            logger.debug(`Setting header ${header}: ${req.headers[header]}`);
          }
        });

        // IMPORTANTE: Reescribir el body porque express.json() ya lo consumió
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);

          proxyReq.setHeader(HEADER_CONTENT_TYPE, CONTENT_TYPE_JSON);
          proxyReq.setHeader(HEADER_CONTENT_LENGTH, Buffer.byteLength(bodyData));

          proxyReq.write(bodyData);
        }

        logger.debug(`Proxy Headers: ${JSON.stringify(req.headers)}`);
        if (req.body) logger.debug(`Proxy Body: ${JSON.stringify(req.body)}`);
        logger.debug(`Proxy Query: ${JSON.stringify(req.query)}`);
        logger.debug(`Proxy Params: ${req.originalUrl}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Asegurar headers CORS
        proxyRes.headers[HEADER_ACCESS_CONTROL_ALLOW_ORIGIN] = req.headers.origin || '*';
        proxyRes.headers[HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS] = 'true';
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (${serviceName} Service): ${err.message}`);

        sendError(
          res,
          `Service unavailable. Unable to reach ${serviceName.toLowerCase()} service.`,
          503,
          {
            service: serviceName.toLowerCase(),
            originalError: err.message,
          }
        );
      },
    })
  );
};

/**
 * Configurar rutas de proxy a microservicios.
 */
export const setupProxyRoutes = (app) => {
  // Proxy a servicio de usuarios
  createServiceProxy(app, '/api/v1/auth', services.users.url, 'Users');

  // Proxy a servicio de admin
  createServiceProxy(app, '/api/v1/admin', services.users.url, 'Admins');

  // Proxy a servicio de perfiles
  createServiceProxy(app, '/api/v1/profile', services.users.url, 'Profiles');

  // Proxy a servicio de pagos
  createServiceProxy(app, '/api/v1/payments', services.payments.url, 'Payments');

  // Proxy a servicio de analytics
  createServiceProxy(app, '/api/v1/analytics', services.analytics.url, 'Analytics');

  // Proxy a servicio de notificaciones
  createServiceProxy(app, '/api/v1/notifications', services.notifications.url, 'Notifications');

  // Proxy a servicio de beats
  createServiceProxy(app, '/api/v1/beats', services.beats.url, 'Beats');

  // 🔥 Proxy a servicio de beats-interactions
  // /api/v1/beats-interactions/*  --->  /api/v1/*
  createServiceProxy(
    app,
    '/api/v1/beats-interactions',
    services.beatsInteractions.url,
    'BeatsInteractions',
    {
      '^/api/v1/beats-interactions': '/api/v1',
    }
  );

  logger.info('✅ Proxy routes configured');
};
