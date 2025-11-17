import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from '../config/services.js';
import logger from '../../logger.js';

/**
 * Configurar rutas de proxy a microservicios
 */
export const setupProxyRoutes = (app) => {
  // Proxy a servicio de usuarios
  app.use(
    '/api/v1/users',
    createProxyMiddleware({
      target: services.users.url,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/users': '/api/v1/users',
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to Users Service: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (Users Service): ${err.message}`);
        res.status(503).json({
          error: 'Service unavailable',
          service: 'users',
          message: 'Unable to reach users service',
        });
      },
    })
  );

  // Proxy a servicio de pagos
  app.use(
    '/api/v1/payments',
    createProxyMiddleware({
      target: services.payments.url,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/payments': '/api/v1/payments',
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to Payments Service: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (Payments Service): ${err.message}`);
        res.status(503).json({
          error: 'Service unavailable',
          service: 'payments',
          message: 'Unable to reach payments service',
        });
      },
    })
  );

  // Proxy a servicio de analytics
  app.use(
    '/api/v1/analytics',
    createProxyMiddleware({
      target: services.analytics.url,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/analytics': '/api/v1/analytics',
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to Analytics Service: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (Analytics Service): ${err.message}`);
        res.status(503).json({
          error: 'Service unavailable',
          service: 'analytics',
          message: 'Unable to reach analytics service',
        });
      },
    })
  );

  // Proxy a servicio de notificaciones
  app.use(
    '/api/v1/notifications',
    createProxyMiddleware({
      target: services.notifications.url,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/notifications': '/api/v1/notifications',
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to Notifications Service: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (Notifications Service): ${err.message}`);
        res.status(503).json({
          error: 'Service unavailable',
          service: 'notifications',
          message: 'Unable to reach notifications service',
        });
      },
    })
  );

  logger.info('✅ Proxy routes configured');
};
