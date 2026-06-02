const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateTokenPair, verifyRefreshToken } = require('../config/jwt');
const { createError } = require('../middlewares/errorHandler');

// ─── Store en mémoire (remplace par ta DB / ORM) ──────────────────────────────
// Ex: const User = require('../models/User');
const users = new Map();
const refreshTokens = new Set(); // En prod : stocker en DB ou Redis

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Vérifie si l'email est déjà utilisé
    const existing = [...users.values()].find((u) => u.email === email);
    if (existing) throw createError(409, 'Cet email est déjà utilisé.');

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = { id: uuidv4(), email, name, password: hashedPassword, role: 'user' };
    users.set(user.id, user);

    const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });
    refreshTokens.add(tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      data: {
        user: sanitizeUser(user),
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = [...users.values()].find((u) => u.email === email);
    if (!user) throw createError(401, 'Email ou mot de passe incorrect.');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw createError(401, 'Email ou mot de passe incorrect.');

    const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });
    refreshTokens.add(tokens.refreshToken);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 */
const refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshTokens.has(refreshToken)) {
      throw createError(401, 'Refresh token invalide ou révoqué.');
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Rotation : invalide l'ancien, émet un nouveau
    refreshTokens.delete(refreshToken);
    const tokens = generateTokenPair({ id: decoded.id, email: decoded.email, role: decoded.role });
    refreshTokens.add(tokens.refreshToken);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 */
const logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) refreshTokens.delete(refreshToken);
    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 */
const me = (req, res) => {
  const user = users.get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  res.json({ success: true, data: { user: sanitizeUser(user) } });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sanitizeUser = ({ password, ...user }) => user; // eslint-disable-line no-unused-vars

module.exports = { register, login, refresh, logout, me };
