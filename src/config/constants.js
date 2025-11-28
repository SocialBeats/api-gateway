/**
 * Constantes para cabeceras HTTP utilizadas en el API Gateway.
 * Centraliza los nombres de las cabeceras para asegurar consistencia entre microservicios.
 */

export const HEADER_USER_ID = 'x-user-id';
export const HEADER_ROLES = 'x-roles';
export const HEADER_GATEWAY_AUTHENTICATED = 'x-gateway-authenticated';

// Standard HTTP Headers
export const HEADER_CONTENT_TYPE = 'Content-Type';
export const HEADER_CONTENT_LENGTH = 'Content-Length';
export const HEADER_ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin';
export const HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS = 'Access-Control-Allow-Credentials';

// Content Types
export const CONTENT_TYPE_JSON = 'application/json';

// Authentication
export const AUTH_BEARER_PREFIX = 'Bearer ';

// Environment
export const ENV_PRODUCTION = 'production';

// Errors
export const ERROR_TOKEN_EXPIRED = 'TokenExpiredError';
export const ERROR_JSON_WEB_TOKEN = 'JsonWebTokenError';
