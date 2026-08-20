function logger(req, res, next) {
  const startTime = process.hrtime.bigint();
  const requestTime = new Date().toISOString();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    console.log(
      `[${requestTime}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(2)}ms`
    );
  });

  next();
}

module.exports = logger;
