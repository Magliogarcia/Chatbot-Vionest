export function errorHandler(err, req, res, next) {
  // Registrar el error en el backend sin exponerlo al cliente
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);

  // Asegurar que no contenga referencias a API keys ni stack traces
  const statusCode = err.statusCode || 500;
  const userMessage = err.isPublic ? err.message : (statusCode === 500 ? 'Ocurrió un error interno en el servidor.' : err.message);

  res.status(statusCode).json({
    success: false,
    error: userMessage
  });
}
