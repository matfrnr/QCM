const { verifyAccessToken } = require('../config/jwt');

/**
 * Middleware d'authentification JWT
 * Vérifie le Bearer token dans le header Authorization
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant ou malformé. Format attendu : Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Disponible dans les controllers via req.user
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré. Utilise /auth/refresh pour en obtenir un nouveau.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.',
        code: 'TOKEN_INVALID',
      });
    }
    next(err);
  }
};

/**
 * Middleware d'autorisation par rôle(s)
 * Usage : authorize('admin') ou authorize(['admin', 'moderator'])
 */
const authorize = (...roles) => {
  // Aplatit les tableaux : authorize('admin') ou authorize(['admin', 'mod'])
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${allowedRoles.join(' ou ')}.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
