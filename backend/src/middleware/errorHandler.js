const errorHandler = (err, req, res, next) => {
  console.error('=== Error occurred ===');
  console.error('Path:', req.method, req.path);
  console.error('Error:', err);
  console.error('Stack:', err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the maximum allowed limit'
    });
  }

  if (err.message && err.message.includes('Only image')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'Resource already exists'
    });
  }

  if (err.code === '23503') {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'Referenced resource does not exist'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
};

export default errorHandler;
