import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from '../config/services.js';
import logger from '../../logger.js';

/**
 * Configurar rutas de proxy a microservicios
 */
export const setupProxyRoutes = (app) => {
  // Proxy a servicio de autenticación
  app.use(
    '/api/v1/auth',
    createProxyMiddleware({
      target: services.auth.url,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/auth': '/api/v1/auth',
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to Users Service: ${req.method} ${req.path}`);
        // IMPORTANTE: Si hay body en la petición (POST/PUT), hay que volver a escribirlo
        // porque el middleware 'express.json()' ya lo ha consumido.
        if (req.body) {
          const bodyData = JSON.stringify(req.body);

          // 1. Asegurarse que los headers de contenido son correctos
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

          // 2. Escribir el cuerpo en el stream de la petición de proxy
          proxyReq.write(bodyData);
          proxyReq.end(); // Terminar el stream de la petición
        }
        logger.debug(`Proxy Headers: ${JSON.stringify(req.headers)}`);
        logger.debug(`Proxy Body: ${JSON.stringify(req.body)}`);
        logger.debug(`Proxy Query: ${JSON.stringify(req.query)}`);
        logger.debug(`Proxy Params: ${req.originalUrl}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Asegurar que los headers CORS se pasen correctamente
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (Auth Service): ${err.message}`);
        res.status(503).json({
          error: 'Service unavailable',
          service: 'auth',
          message: 'Unable to reach auth service',
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
