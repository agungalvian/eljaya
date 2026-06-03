// Global async error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);

  // Prisma errors
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Data tidak ditemukan' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Data duplikat — sudah ada dengan nilai yang sama' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan internal server',
  });
};

module.exports = errorHandler;
