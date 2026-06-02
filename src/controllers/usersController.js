/**
 * Exemple de controller pour une ressource protégée
 * Remplace par ta logique métier + appels DB
 */

/**
 * GET /users — admin seulement
 */
const getAll = (req, res) => {
  res.json({
    success: true,
    data: {
      message: `Bonjour admin ${req.user.email}, voici la liste des utilisateurs.`,
      users: [], // TODO: récupérer depuis la DB
    },
  });
};

/**
 * GET /users/:id
 */
const getOne = (req, res) => {
  const { id } = req.params;

  // Un user ne peut voir que son propre profil (sauf admin)
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  res.json({
    success: true,
    data: { id }, // TODO: récupérer depuis la DB
  });
};

module.exports = { getAll, getOne };
