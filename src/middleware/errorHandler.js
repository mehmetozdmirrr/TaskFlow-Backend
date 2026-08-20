function isValidHttpStatus(status) {
  return typeof status === 'number' && status >= 400 && status <= 599;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);

  const isJsonSyntaxError = err.type === 'entity.parse.failed' || err instanceof SyntaxError;

  let status = isValidHttpStatus(err.status)
    ? err.status
    : isValidHttpStatus(err.statusCode)
      ? err.statusCode
      : 500;

  let message = 'Internal Server Error';

  if (isJsonSyntaxError) {
    status = 400;
    message = 'Invalid JSON payload';
  }

  res.status(status).json({
    success: false,
    message,
    errors: [],
  });
}

module.exports = errorHandler;
