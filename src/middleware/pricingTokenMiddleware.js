/**
 * Middleware de Pricing Token para inyectar tokens de Space en respuestas proxy.
 *
 * Este módulo permite enriquecer las respuestas del API Gateway con un token
 * de pricing generado por Space, que el frontend puede usar para validar
 * límites de uso según el plan del usuario.
 *
 * IMPORTANTE: El token se genera en onProxyReq (antes de llamar al microservicio)
 * porque onProxyRes no puede esperar promesas - los headers ya se están enviando.
 */

import { getSpaceClient, isSpaceClientReady } from '../lib/spaceClient.js';

/**
 * Genera el Pricing-Token ANTES de la llamada al microservicio.
 * Se usa dentro del callback onProxyReq de http-proxy-middleware.
 * Guarda el token en req.pricingToken para que onProxyRes lo inyecte.
 *
 * @param {Object} proxyReq - Request al microservicio
 * @param {Object} req - Request original de Express
 */
export const generatePricingToken = async (proxyReq, req) => {
  const userId = req.headers['x-user-id'];

  if (!isSpaceClientReady()) {
    console.warn('[PricingToken] SpaceClient no inicializado.');
    return;
  }

  if (!userId) {
    // Usuario no autenticado, no generamos token
    return;
  }

  try {
    const spaceClient = getSpaceClient();
    const token = await spaceClient.features.generateUserPricingToken(userId);
    // Guardar en el request para usarlo después en onProxyRes
    req.pricingToken = token;
    console.log(`[PricingToken] Token generado para UserID: ${userId}`);
  } catch (error) {
    console.error('[PricingToken] Error generando pricing token:', error.message);
  }
};

/**
 * Inyecta el Pricing-Token en el header de respuesta del proxy.
 * Se usa dentro del callback onProxyRes de http-proxy-middleware.
 * DEBE ser síncrono - solo lee el token que ya generamos antes.
 *
 * @param {Object} proxyRes - Respuesta del microservicio (IncomingMessage)
 * @param {Object} req - Request original de Express
 */
export const injectPricingToken = (proxyRes, req) => {
  // Solo inyectar si tenemos un token pre-generado
  if (req.pricingToken) {
    proxyRes.headers['Pricing-Token'] = req.pricingToken;
    console.log('[PricingToken] Token inyectado en respuesta');
  }
};

export default { generatePricingToken, injectPricingToken };
