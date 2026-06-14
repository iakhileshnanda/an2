module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Never expose stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong',
    ...(isDev && { stack: err.stack })
  });
};
