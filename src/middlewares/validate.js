const Joi = require('joi');

/**
 * Middleware de validation des requêtes avec Joi
 * Usage : validate(schema) — valide req.body par défaut
 *         validate(schema, 'params') — valide req.params
 *         validate(schema, 'query') — valide req.query
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,   // Retourne toutes les erreurs d'un coup
      stripUnknown: true,  // Supprime les champs non définis dans le schéma
    });

    if (error) {
      return res.status(422).json({
        success: false,
        message: 'Données invalides.',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
        })),
      });
    }

    // Remplace req[target] par les données validées/nettoyées
    req[target] = value;
    next();
  };
};

// ─── Schémas réutilisables ────────────────────────────────────────────────────
const schemas = {
  auth: {
    register: Joi.object({
      email: Joi.string().email().lowercase().trim().required(),
      password: Joi.string().min(8).max(100).required(),
      name: Joi.string().min(2).max(50).trim().required(),
    }),
    login: Joi.object({
      email: Joi.string().email().lowercase().trim().required(),
      password: Joi.string().required(),
    }),
    refresh: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },
};

module.exports = { validate, schemas };
