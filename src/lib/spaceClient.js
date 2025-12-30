/**
 * Singleton del cliente de Space.
 *
 * Inicializa una vez en server.js y úsalo en cualquier parte del código
 * con getSpaceClient().
 *
 * @module lib/spaceClient
 */

import { connect } from 'space-node-client';

let instance = null;

/**
 * Inicializa el cliente de Space. Llamar una vez al arrancar el servidor.
 *
 * @param {Object} options - Opciones de configuración del cliente
 * @param {string} options.url - URL del servidor de Space
 * @param {string} options.apiKey - API Key de Space
 * @returns {Object} Instancia del SpaceClient
 *
 * @example
 * // En server.js:
 * import { initSpaceClient } from './src/lib/spaceClient.js';
 * initSpaceClient({
 *   url: process.env.SPACE_URL,
 *   apiKey: process.env.SPACE_API_KEY,
 * });
 */
export const initSpaceClient = (options) => {
  if (!instance) {
    instance = connect(options);
    console.log('[SpaceClient] Inicializado correctamente');
  }
  return instance;
};

/**
 * Obtiene la instancia del SpaceClient.
 *
 * @returns {Object} Instancia del SpaceClient
 * @throws {Error} Si el cliente no ha sido inicializado
 *
 * @example
 * // En cualquier archivo:
 * import { getSpaceClient } from '../lib/spaceClient.js';
 * const spaceClient = getSpaceClient();
 * const token = await spaceClient.features.generateUserPricingToken(userId);
 */
export const getSpaceClient = () => {
  if (!instance) {
    throw new Error(
      '[SpaceClient] No inicializado. Llama a initSpaceClient() en server.js primero.'
    );
  }
  return instance;
};

/**
 * Verifica si el cliente está inicializado (sin lanzar error).
 *
 * @returns {boolean} true si está inicializado
 */
export const isSpaceClientReady = () => {
  return instance !== null;
};

export default { initSpaceClient, getSpaceClient, isSpaceClientReady };
