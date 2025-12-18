import logger from '../../logger.js';
import { sendError } from './response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;

  // 500 Internal Server Error (u otro código): Manejador global de errores.
  sendError(res, message, statusCode, err.stack);
};
