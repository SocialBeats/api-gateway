/**
 * Configuración de CORS (Cross-Origin Resource Sharing).
 *
 * Define las políticas de seguridad para permitir o bloquear peticiones desde otros dominios.
 *
 * Estrategia:
 * - Development: Permite cualquier origen (`origin: true`) para facilitar el desarrollo local.
 * - Production: Valida contra una lista blanca (`ALLOWED_ORIGINS`) definida en variables de entorno.
 *   Si el origen no está en la lista o es undefined (server-to-server), se bloquea.
 */
export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Soportar wildcard "*"
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-User-Id',
    'X-Pricing-Plan',
    'Pricing-Token',
  ],
  exposedHeaders: ['Pricing-Token'],
};
