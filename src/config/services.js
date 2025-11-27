/**
 * Configuración de los microservicios.
 *
 * IMPORTANTE: Para registrar un nuevo servicio:
 * 1. Añade la entrada correspondiente en este objeto `services`.
 * 2. Asegúrate de leer la URL desde las variables de entorno (.env), definiendo un fallback para desarrollo local.
 */
export const services = {
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
  },
  payments: {
    url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3002',
    timeout: 5000,
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
    timeout: 5000,
  },
  notifications: {
    url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
    timeout: 3000,
  },
};

export const getServiceUrl = (serviceName) => {
  const service = services[serviceName];
  if (!service) {
    throw new Error(`Service ${serviceName} not found in configuration`);
  }
  return service.url;
};

export const getServiceTimeout = (serviceName) => {
  const service = services[serviceName];
  return service?.timeout || 5000;
};
