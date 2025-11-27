import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from '../config/services.js';
import logger from '../../logger.js';
import { sendError } from '../utils/response.js';

/**
 * Función factory para crear un proxy de servicio con configuración estándar.
 *
 * @param {Object} app - Instancia de aplicación Express
 * @param {string} route - La ruta base para el proxy (ej: '/api/v1/users')
 * @param {string} target - La URL destino del microservicio
 * @param {string} serviceName - El nombre del servicio para logging
 */
const createServiceProxy = (app, route, target, serviceName) => {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${route}`]: route,
      },
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to ${serviceName} Service: ${req.method} ${req.path}`);

        // IMPORTANTE: Si hay body en la petición (POST/PUT), hay que volver a escribirlo
        // porque el middleware 'express.json()' ya lo ha consumido.
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);

          // 1. Asegurarse que los headers de contenido son correctos
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

          // 2. Escribir el cuerpo en el stream de la petición de proxy
          proxyReq.write(bodyData);
          proxyReq.end(); // Terminar el stream de la petición
        }

        logger.debug(`Proxy Headers: ${JSON.stringify(req.headers)}`);
        if (req.body) logger.debug(`Proxy Body: ${JSON.stringify(req.body)}`);
        logger.debug(`Proxy Query: ${JSON.stringify(req.query)}`);
        logger.debug(`Proxy Params: ${req.originalUrl}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Asegurar que los headers CORS se pasen correctamente
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error (${serviceName} Service): ${err.message}`);
        // 503 Service Unavailable: El servidor actualmente no puede manejar la petición debido a sobrecarga temporal o mantenimiento programado.
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
  createServiceProxy(app, '/api/v1/users', services.users.url, 'Users');

  // Proxy a servicio de pagos
  createServiceProxy(app, '/api/v1/payments', services.payments.url, 'Payments');

  // Proxy a servicio de analytics
  createServiceProxy(app, '/api/v1/analytics', services.analytics.url, 'Analytics');

  // Proxy a servicio de notificaciones
  createServiceProxy(app, '/api/v1/notifications', services.notifications.url, 'Notifications');

  logger.info('✅ Proxy routes configured');
};
