/**
 * Middleware 404 — route introuvable
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route introuvable : ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

/**
 * Middleware global de gestion d'erreurs
 * Doit être enregistré EN DERNIER dans app.js
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;

  // Log en dev, moins verbeux en prod
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erreur interne du serveur.',
    // Stack uniquement en développement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Helper pour créer des erreurs avec statusCode
 * Usage : throw createError(400, 'Email invalide')
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { notFound, errorHandler, createError };
