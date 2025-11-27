/**
 * Utilidades de Respuesta API Estandarizada.
 *
 * Asegura una estructura de respuesta consistente en todo el API Gateway.
 */

/**
 * Envía una respuesta de éxito (2xx).
 *
 * @param {import('express').Response} res - Objeto response de Express
 * @param {any} data - Los datos a retornar
 * @param {string} [message='Success'] - Mensaje de éxito opcional
 * @param {number} [statusCode=200] - Código de estado HTTP
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Envía una respuesta de error (4xx, 5xx).
 *
 * @param {import('express').Response} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} [statusCode=500] - Código de estado HTTP
 * @param {any} [errorDetails=null] - Detalles técnicos opcionales (evitar filtrar información sensible en prod)
 */
export const sendError = (res, message, statusCode = 500, errorDetails = null) => {
  const response = {
    success: false,
    error: getErrorType(statusCode),
    message,
    timestamp: new Date().toISOString(),
  };

  if (errorDetails && process.env.NODE_ENV !== 'production') {
    response.details = errorDetails;
  }

  res.status(statusCode).json(response);
};

/**
 * Función auxiliar para determinar el tipo de error según el código de estado.
 */
const getErrorType = (statusCode) => {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 504:
      return 'Gateway Timeout';
    default:
      return 'Error';
  }
};
