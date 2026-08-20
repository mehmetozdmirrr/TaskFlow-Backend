function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
}

module.exports = notFound;
